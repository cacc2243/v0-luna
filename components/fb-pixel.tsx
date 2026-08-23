'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

interface PublicPixel {
  pixel_id: string
}

/**
 * Carrega o fbevents.js, inicializa todos os pixels habilitados (configurados
 * no painel) e dispara PageView em cada navegacao (incluindo SPA navigation).
 * Os Pixel IDs vem da API publica; o access token NUNCA chega ao browser.
 */
export function FbPixel() {
  const [pixels, setPixels] = useState<PublicPixel[]>([])
  const initializedRef = useRef(false)
  const pathname = usePathname()

  useEffect(() => {
    let active = true
    fetch('/api/pixels/public')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && Array.isArray(d.pixels)) {
          setPixels(d.pixels)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // Inicializa os pixels assim que a lista estiver pronta. O snippet define
  // window.fbq de forma sincrona (com fila), entao fazemos um curto polling
  // para garantir que esteja disponivel.
  useEffect(() => {
    if (pixels.length === 0) return
    if (initializedRef.current) return

    let attempts = 0
    const tryInit = () => {
      const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq
      if (typeof fbq === 'function') {
        // Registro global dos pixels ja inicializados nesta pagina. Evita que
        // o fbq('init') rode mais de uma vez para o mesmo Pixel ID (ex.: ao
        // remontar o componente em navegacao/StrictMode), o que duplicaria os
        // listeners automaticos do Meta e faria eventos como
        // "SubscribedButtonClick" dispararem 2x com dados identicos.
        const w = window as unknown as {
          __fbqInitialized?: Set<string>
          __fbqReady?: boolean
          __fbqQueue?: Array<() => void>
        }
        if (!w.__fbqInitialized) w.__fbqInitialized = new Set<string>()

        // Deduplica os IDs vindos da API antes de inicializar.
        const uniqueIds = Array.from(new Set(pixels.map((p) => p.pixel_id)))
        for (const id of uniqueIds) {
          if (w.__fbqInitialized.has(id)) continue
          // Desativa a "configuracao automatica" do Meta ANTES do init.
          //
          // Sem isso, o fbevents.js varre a pagina e INFERE eventos padrao a
          // partir de cliques em botoes e de textos que parecem preco (flags
          // InferredEvents / SmartSetupTotalPriceExtraction / Microdata).
          // Isso gerava eventos fantasma: InitiateCheckout ao avancar os
          // passos da home e Purchase ao "aceitar" as vendas da simulacao do
          // app (GuidedAppDemo), que sao 100% ficticias e nao tocam a rede.
          //
          // Estas flags vem da config que a Meta serve POR PIXEL, por isso o
          // problema aparecia so em um dos pixels.
          //
          // ATENCAO: isto NAO desliga o Event Setup Tool (ESTRuleEngine
          // continua true). Regras criadas manualmente no Gerenciador de
          // Eventos precisam ser removidas por lá.
          fbq('set', 'autoConfig', false, id)
          fbq('init', id)
          w.__fbqInitialized.add(id)
        }
        fbq('track', 'PageView')
        initializedRef.current = true
        // Sinaliza que os pixels foram inicializados, para que eventos
        // disparados cedo (ex.: InitiateCheckout) aguardem e nao se percam.
        // Em seguida, drena a fila de eventos que ficaram pendentes.
        w.__fbqReady = true
        if (Array.isArray(w.__fbqQueue)) {
          for (const fn of w.__fbqQueue) {
            try {
              fn()
            } catch {
              // ignora falhas individuais de eventos enfileirados
            }
          }
          w.__fbqQueue = []
        }
        return
      }
      attempts += 1
      if (attempts < 40) {
        setTimeout(tryInit, 100)
      }
    }
    tryInit()
  }, [pixels])

  // Dispara PageView em mudancas de rota (apos a inicializacao).
  useEffect(() => {
    if (!initializedRef.current) return
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq
    if (typeof fbq === 'function') {
      fbq('track', 'PageView')
    }
  }, [pathname])

  if (pixels.length === 0) return null

  return (
    <Script
      id="fb-pixel-base"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          /* ------------------------------------------------------------------
           * GUARDA ANTI-EVENTO-FANTASMA (roda ANTES do fbevents.js)
           *
           * O Meta entrega, por pixel, regras que disparam eventos sozinhas
           * (Event Setup Tool / ESTRuleEngine, InferredEvents, SmartSetup).
           * Elas rodam dentro do fbevents.js e NAO sao desligaveis por
           * autoConfig=false, por isso a home disparava InitiateCheckout ao
           * avancar etapas e a simulacao do app disparava Purchase ao
           * "aceitar" vendas ficticias.
           *
           * Aqui invertemos o controle: interceptamos o envio na REDE e so
           * deixamos passar eventos que o nosso proprio codigo autorizou via
           * window.__fbAllow(). Tudo que a Meta inferir sozinha e descartado.
           * ------------------------------------------------------------------ */
          !function(w){
            if (w.__fbGuard) return;
            w.__fbGuard = true;
            var allow = {};
            /* Autoriza um evento por uma janela curta (o fbq envia 1 request
             * por pixel inicializado, entao a janela cobre todos eles). */
            w.__fbAllow = function(ev){ if(ev) allow[ev] = Date.now() + 8000; };
            /* PageView e sempre nosso: disparado no init e em cada rota. */
            var ALWAYS = { PageView: 1 };
            function blocked(url){
              try {
                var s = String(url || '');
                if (s.indexOf('facebook.com/tr') === -1) return false;
                var ev = new URL(s, location.href).searchParams.get('ev');
                if (!ev) return false;            /* formato desconhecido: nao bloqueia */
                if (ALWAYS[ev]) return false;
                if (allow[ev] && allow[ev] > Date.now()) return false;
                console.log('[v0] Evento fantasma do pixel bloqueado:', ev);
                return true;
              } catch (e) { return false; }
            }
            var sb = w.navigator.sendBeacon;
            if (sb) w.navigator.sendBeacon = function(u){
              if (blocked(u)) return true;
              return sb.apply(w.navigator, arguments);
            };
            var of = w.fetch;
            if (of) w.fetch = function(u){
              var t = (typeof u === 'string') ? u : (u && u.url);
              if (blocked(t)) return Promise.resolve(new Response('', { status: 204 }));
              return of.apply(this, arguments);
            };
            var xo = w.XMLHttpRequest.prototype.open;
            var xs = w.XMLHttpRequest.prototype.send;
            w.XMLHttpRequest.prototype.open = function(m, u){
              this.__fbBlocked = blocked(u);
              return xo.apply(this, arguments);
            };
            w.XMLHttpRequest.prototype.send = function(){
              if (this.__fbBlocked) return;
              return xs.apply(this, arguments);
            };
            var d = Object.getOwnPropertyDescriptor(w.HTMLImageElement.prototype, 'src');
            if (d && d.set) Object.defineProperty(w.HTMLImageElement.prototype, 'src', {
              configurable: true, enumerable: d.enumerable, get: d.get,
              set: function(v){ if (blocked(v)) return; return d.set.call(this, v); }
            });
          }(window);

          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
        `,
      }}
    />
  )
}
