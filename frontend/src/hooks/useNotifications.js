import { useEffect, useRef, useState } from 'react';

const LEVEL_ORDER   = { normal: 0, watch: 1, warning: 2, emergency: 3 };
const LEVEL_EMOJI   = { normal: '✅', watch: '👁️', warning: '⚠️', emergency: '🚨' };
const LEVEL_LABEL   = { normal: 'Normal', watch: 'Vigilancia', warning: 'Aviso', emergency: 'EMERGENCIA' };

/**
 * Gestiona las notificaciones push del browser.
 * - Solicita permiso solo cuando el usuario hace clic en el botón de notificaciones.
 * - Dispara una notificación cuando el nivel de alerta escala o de-escala.
 */
export function useNotifications(alertState) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const prevLevel = useRef(null);

  // Detecta cambios de nivel y dispara notificación si el permiso está concedido
  useEffect(() => {
    const current = alertState?.level;
    if (!current || prevLevel.current === null) {
      prevLevel.current = current;
      return;
    }

    if (prevLevel.current !== current && permission === 'granted') {
      const prev    = prevLevel.current;
      const isUp    = (LEVEL_ORDER[current] ?? 0) > (LEVEL_ORDER[prev] ?? 0);
      const isDown  = !isUp;

      const title = isUp
        ? `${LEVEL_EMOJI[current]} Alerta escalada — NubeVigía RD`
        : `${LEVEL_EMOJI[current]} Alerta bajó — NubeVigía RD`;

      const province = alertState.triggers?.[0]?.province;
      const body = [
        `Nivel: ${LEVEL_LABEL[prev]} → ${LEVEL_LABEL[current]}`,
        province ? `Zona afectada: ${province}` : null,
        isDown && current === 'normal' ? 'Condiciones normales restauradas.' : null,
      ].filter(Boolean).join('\n');

      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag:  'nuvigia-alert',   // reemplaza notificaciones anteriores del mismo tag
          silent: current === 'normal', // silenciosa al volver a normal
        });
      } catch { /* algunos browsers bloquean Notification en iframes */ }
    }

    prevLevel.current = current;
  }, [alertState?.level, permission]);

  async function requestPermission() {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }

  return { permission, requestPermission };
}
