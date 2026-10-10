// Apply the saved desktop rail before paint. A native dialog provides the phone drawer's focus trap.
(() => {
  const root = document.documentElement, KEY = 'flamescope.sidebar';
  let collapsed = false;
  try { collapsed = localStorage.getItem(KEY) === 'collapsed'; } catch {}
  root.dataset.sidebar = collapsed ? 'collapsed' : 'expanded';
  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('#sidebar-toggle'), sidebar = document.querySelector('#workspace-sidebar');
    const header = document.querySelector('#workspace-header'), brand = document.querySelector('.toolbar .brand'), mark = document.querySelector('.brand-mark');
    const drawer = document.querySelector('#sidebar-drawer'), parent = sidebar.parentNode, anchor = sidebar.nextElementSibling;
    const mobile = matchMedia('(max-width:820px)');
    for (const link of sidebar.querySelectorAll('.nav')) link.title = link.getAttribute('aria-label') || link.textContent.trim();
    let returnFocus = true;
    function sync() {
      const target = mobile.matches ? brand : header;
      if (toggle.parentNode !== target) {
        if (mobile.matches) brand.insertBefore(toggle, mark); else header.append(toggle);
      }
      const expanded = mobile.matches ? drawer.open : !collapsed;
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.setAttribute('aria-label', mobile.matches ? (expanded ? 'Close sidebar' : 'Open sidebar') : (expanded ? 'Collapse sidebar' : 'Expand sidebar'));
      toggle.title = toggle.getAttribute('aria-label');
    }
    function restore() { if (sidebar.parentNode !== parent) parent.insertBefore(sidebar, anchor); sync(); }
    function close(focus = true) { returnFocus = focus; drawer.close(); restore(); }
    toggle.addEventListener('click', () => {
      if (mobile.matches) {
        if (drawer.open) close();
        else { returnFocus = true; drawer.append(sidebar); drawer.showModal(); sync(); }
      } else {
        collapsed = !collapsed; root.dataset.sidebar = collapsed ? 'collapsed' : 'expanded';
        try { localStorage.setItem(KEY, root.dataset.sidebar); } catch {}
        sync();
      }
    });
    drawer.addEventListener('close', () => { restore(); if (returnFocus) toggle.focus(); });
    drawer.addEventListener('click', event => {
      if (event.target.closest('#sidebar-close')) close();
      else if (event.target.closest('a, [data-open-question]')) close(false);
      else if (event.target === drawer) {
        const b = drawer.getBoundingClientRect();
        if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) close();
      }
    });
    mobile.addEventListener('change', () => { if (drawer.open) close(false); sync(); });
    toggle.hidden = false; sync();
  });
})();
