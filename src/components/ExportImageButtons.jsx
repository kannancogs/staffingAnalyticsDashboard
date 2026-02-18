// components/ExportImageButtons.jsx
import React from 'react';
import html2canvas from 'html2canvas';

export default function ExportImageButtons({
  targetRef,
  headerSelector = '#app-header',
  defaultFilename = 'dashboard',
  scale = 2,
  expandSelectors = ['[data-export-full="true"]'],
  ignoreSelectors = ['.no-export ss', '[data-export-ignore="true"]'],
  showButtons = true,
  className,
  formats = ['png', 'jpeg'],
}) {
  const exportAs = async (format = 'png') => {
    try {
      const exportNode = targetRef?.current;
      if (!exportNode) {
        alert('Nothing to export yet.');
        return;
      }

      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const realCanvases = Array.from(exportNode.querySelectorAll('canvas'));
      const canvasSnapshots = realCanvases.map((c) => ({
        dataUrl: c.toDataURL('image/png'),
        width: c.width,
        height: c.height,
        styleWidth: c.style.width,
        styleHeight: c.style.height,
      }));

      const temp = document.createElement('div');
      temp.id = '__export_root__';
      temp.style.position = 'fixed';
      temp.style.left = '-100000px';
      temp.style.top = '0';
      temp.style.background = '#ffffff';
      temp.style.padding = '16px';

      const exportWidth =
        exportNode.getBoundingClientRect?.().width ||
        document.querySelector('.container')?.getBoundingClientRect?.().width ||
        document.body.clientWidth || 1200;

      temp.style.width = `${Math.min(Math.max(720, Math.round(exportWidth)), 1600)}px`;

      const headerNode = headerSelector ? document.querySelector(headerSelector) : null;
      if (headerNode) temp.appendChild(headerNode.cloneNode(true));

      const spacer = document.createElement('div');
      spacer.style.height = '8px';
      temp.appendChild(spacer);

      const wrapper = document.createElement('div');
      wrapper.id = '__export_content__';
      wrapper.appendChild(exportNode.cloneNode(true));
      temp.appendChild(wrapper);

      document.body.appendChild(temp);

      const dpr = window.devicePixelRatio || 1;
      const effectiveScale = Math.min(scale || 2, dpr, 2);

      const canvas = await html2canvas(temp, {
        backgroundColor: '#ffffff',
        scale: effectiveScale,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        ignoreElements: (el) => !!ignoreSelectors.find((sel) => el?.matches?.(sel)),
        onclone: (doc) => {
          const root = doc.getElementById('__export_root__');
          if (!root) return;

          ignoreSelectors.forEach((sel) => {
            root.querySelectorAll(sel).forEach((el) => el.remove());
          });

          expandSelectors.forEach((sel) => {
            root.querySelectorAll(sel).forEach((el) => {
              el.style.maxHeight = 'none';
              el.style.overflow = 'visible';
            });
          });

          const cloneContent = doc.getElementById('__export_content__') || root;
          const clonedCanvases = Array.from(cloneContent.querySelectorAll('canvas'));
          clonedCanvases.forEach((cnv, i) => {
            const snap = canvasSnapshots[i];
            if (!snap) return;
            const img = doc.createElement('img');
            img.src = snap.dataUrl;
            if (snap.styleWidth) img.style.width = snap.styleWidth;
            if (snap.styleHeight) img.style.height = snap.styleHeight;
            if (snap.width) img.width = snap.width;
            if (snap.height) img.height = snap.height;
            cnv.replaceWith(img);
          });
        },
      });

      document.body.removeChild(temp);

      const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const quality = format === 'jpeg' ? 0.92 : 1;
      const filename = `${defaultFilename}_${new Date().toISOString().slice(0, 10)}.${format === 'jpeg' ? 'jpg' : 'png'}`;

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
      if (!blob) {
        const dataUrl = canvas.toDataURL(mime, quality);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
      alert('Sorry, exporting failed. See console for details.');
    }
  };

  // console.log('ExportImageButtons formats:', formats);

  return (
  <div className={className}>
    {showButtons && (
      <div>
        {/* Example: if you later want PNG */}
        {/* {formats.includes('png') && (
          <button className="btn btn-sm" onClick={() => exportAs('png')}>
            ⬇️ Download PNG
          </button>
        )} */}

        {formats.includes('jpeg') && (
          <div className="downloadRow">
            <div className="buttonDwnld" onClick={() => exportAs('jpeg')} data-tooltip="Screenshot" title="Download JPEG">
              <div className="button-wrapper">
                <div className="text">Download</div>
                <span className="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    role="img"
                    width="2em"
                    height="2em"
                    preserveAspectRatio="xMidYMid meet"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"
                    />
                  </svg>
                </span>
              </div>
            </div>            
          </div>
        )}
      </div>
    )}
  </div>
);
}