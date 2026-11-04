(() => {
  const MES_ROLE = 'IslandChill MES User';
  const ADMIN_ROLE = 'IslandChill Admin User';
  const SWITCH_ID = 'islandchill-mes-switch';
  const DROPDOWN_SWITCH_ID = 'islandchill-mes-dropdown-switch';

  const ISLANDCHILL_ROLES = [
    'IslandChill MES User',
    'IslandChill Admin User',
    'Technical Production Coordinator',
    'Production Manager',
    'Lab Technicians',
    'OHS Rep',
    'Quality Checks',
    'Supervisor',
    'Warehouse Supervisor',
    'Gardener'
  ];

  const getRoles = () => {
    if (window.frappe) {
      if (Array.isArray(frappe.user_roles) && frappe.user_roles.length > 0) return frappe.user_roles;
      if (frappe.boot?.user?.roles && Array.isArray(frappe.boot.user.roles)) return frappe.boot.user.roles;
      if (frappe.session?.user === 'Administrator') return ['Administrator', 'System Manager', ...ISLANDCHILL_ROLES];
      if (frappe.boot?.user?.name === 'Administrator') return ['Administrator', 'System Manager', ...ISLANDCHILL_ROLES];
    }
    return [];
  };

  const canSwitchToMES = () => {
    const roles = getRoles();
    if (roles.includes('Administrator') || roles.includes('System Manager')) return true;
    return roles.some((r) => ISLANDCHILL_ROLES.includes(r));
  };

  const installLogoutRedirect = () => {
    if (window.frappe && frappe.app) {
      frappe.app.redirect_to_login = () => {
        window.location.href = '/islandchill?logout=1';
      };
    }
  };

  const installStyles = () => {
    if (document.getElementById('islandchill-portal-switch-style')) return;
    const style = document.createElement('style');
    style.id = 'islandchill-portal-switch-style';
    style.textContent = `
      #${SWITCH_ID} {
        display: inline-flex !important;
        align-items: center !important;
        z-index: 1020 !important;
        box-sizing: border-box !important;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      #${SWITCH_ID} .islandchill-switch-link {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 5px 12px !important;
        border: 1px solid #d97706 !important;
        border-radius: 8px !important;
        color: #b45309 !important;
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.18)) !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        text-decoration: none !important;
        white-space: nowrap !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        box-shadow: 0 1px 3px rgba(217, 119, 6, 0.12) !important;
        cursor: pointer !important;
        line-height: 1.5 !important;
        box-sizing: border-box !important;
      }
      #${SWITCH_ID} .islandchill-switch-link:hover {
        border-color: #b45309 !important;
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(217, 119, 6, 0.28)) !important;
        color: #92400e !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 8px -1px rgba(217, 119, 6, 0.2) !important;
      }
      #${SWITCH_ID} .islandchill-switch-icon {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 14px !important;
        line-height: 1 !important;
        flex-shrink: 0 !important;
      }
      #${SWITCH_ID} .islandchill-switch-text {
        display: inline-block !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        transition: opacity 0.2s ease !important;
      }

      /* Desktop top navbar styling */
      .desktop-navbar #${SWITCH_ID},
      header.navbar #${SWITCH_ID},
      .navbar #${SWITCH_ID} {
        margin-right: 12px !important;
      }

      /* Desk Sidebar base styling */
      .body-sidebar #${SWITCH_ID} {
        display: flex !important;
        width: 100% !important;
        margin: 6px 0 8px 0 !important;
        padding: 0 4px !important;
        justify-content: center !important;
        box-sizing: border-box !important;
      }

      /* Sidebar EXPANDED state: full width pill */
      .body-sidebar-container.expanded #${SWITCH_ID}:not(.is-collapsed) {
        padding: 0 4px !important;
      }
      .body-sidebar-container.expanded #${SWITCH_ID}:not(.is-collapsed) .islandchill-switch-link {
        width: 100% !important;
        justify-content: center !important;
        padding: 6px 10px !important;
        gap: 6px !important;
      }
      .body-sidebar-container.expanded #${SWITCH_ID}:not(.is-collapsed) .islandchill-switch-text {
        display: inline-block !important;
      }

      /* Sidebar COLLAPSED states (by container class or .is-collapsed class) */
      .body-sidebar-container:not(.expanded) #${SWITCH_ID},
      .body-sidebar-container.collapsed #${SWITCH_ID},
      .body-sidebar.collapsed #${SWITCH_ID},
      .body-sidebar[data-collapsed="true"] #${SWITCH_ID},
      #${SWITCH_ID}.is-collapsed {
        width: 100% !important;
        margin: 6px auto 8px auto !important;
        padding: 0 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
      }

      .body-sidebar-container:not(.expanded) #${SWITCH_ID} .islandchill-switch-link,
      .body-sidebar-container.collapsed #${SWITCH_ID} .islandchill-switch-link,
      .body-sidebar.collapsed #${SWITCH_ID} .islandchill-switch-link,
      .body-sidebar[data-collapsed="true"] #${SWITCH_ID} .islandchill-switch-link,
      #${SWITCH_ID}.is-collapsed .islandchill-switch-link {
        width: 34px !important;
        min-width: 34px !important;
        max-width: 34px !important;
        height: 34px !important;
        padding: 0 !important;
        border-radius: 8px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin: 0 auto !important;
        gap: 0 !important;
        box-sizing: border-box !important;
      }

      .body-sidebar-container:not(.expanded) #${SWITCH_ID} .islandchill-switch-text,
      .body-sidebar-container.collapsed #${SWITCH_ID} .islandchill-switch-text,
      .body-sidebar.collapsed #${SWITCH_ID} .islandchill-switch-text,
      .body-sidebar[data-collapsed="true"] #${SWITCH_ID} .islandchill-switch-text,
      #${SWITCH_ID}.is-collapsed .islandchill-switch-text {
        display: none !important;
      }

      .body-sidebar-container:not(.expanded) #${SWITCH_ID} .islandchill-switch-icon,
      .body-sidebar-container.collapsed #${SWITCH_ID} .islandchill-switch-icon,
      .body-sidebar.collapsed #${SWITCH_ID} .islandchill-switch-icon,
      .body-sidebar[data-collapsed="true"] #${SWITCH_ID} .islandchill-switch-icon,
      #${SWITCH_ID}.is-collapsed .islandchill-switch-icon {
        font-size: 16px !important;
        margin: 0 !important;
      }

      /* Dark theme support */
      [data-theme="dark"] #${SWITCH_ID} .islandchill-switch-link,
      [data-theme-mode="dark"] #${SWITCH_ID} .islandchill-switch-link {
        border-color: rgba(245, 158, 11, 0.5) !important;
        background: rgba(245, 158, 11, 0.15) !important;
        color: #fbbf24 !important;
      }
    `;
    document.head.appendChild(style);
  };

  const createSwitchElement = () => {
    const item = document.createElement('div');
    item.id = SWITCH_ID;
    item.className = 'islandchill-switch-container';
    item.setAttribute('data-toggle', 'tooltip');
    item.setAttribute('data-placement', 'right');
    item.setAttribute('title', 'Switch to IslandChill MES');
    item.innerHTML = [
      '<a class="islandchill-switch-link" href="/islandchill?portal=mes" title="Switch to IslandChill MES" aria-label="Switch to IslandChill MES">',
      '  <span class="islandchill-switch-icon">🏭</span>',
      '  <span class="islandchill-switch-text">Switch to IslandChill MES</span>',
      '</a>'
    ].join('');
    return item;
  };

  const updateCollapsedState = () => {
    const sw = document.getElementById(SWITCH_ID);
    if (!sw) return;

    const sidebar = sw.closest('.body-sidebar');
    const container = sw.closest('.body-sidebar-container');

    if (!sidebar && !container) {
      sw.classList.remove('is-collapsed');
      return;
    }

    let isCollapsed = false;
    if (container && !container.classList.contains('expanded')) {
      isCollapsed = true;
    } else if (sidebar && sidebar.offsetWidth > 0 && sidebar.offsetWidth < 100) {
      isCollapsed = true;
    } else if (window.frappe?.app?.sidebar && window.frappe.app.sidebar.sidebar_expanded === false) {
      isCollapsed = true;
    }

    if (isCollapsed) {
      sw.classList.add('is-collapsed');
      if (window.$ && $.fn && $.fn.tooltip) {
        $(sw).attr('data-toggle', 'tooltip').attr('data-placement', 'right').attr('title', 'Switch to IslandChill MES');
      }
    } else {
      sw.classList.remove('is-collapsed');
      if (window.$ && $.fn && $.fn.tooltip) {
        $(sw).tooltip('dispose');
      }
    }
  };

  const observeSidebar = () => {
    const container = document.querySelector('.body-sidebar-container');
    const sidebar = document.querySelector('.body-sidebar');

    if (container && !container._islandchill_mo && window.MutationObserver) {
      const mo = new MutationObserver(() => {
        updateCollapsedState();
      });
      mo.observe(container, { attributes: true, attributeFilter: ['class', 'style'] });
      container._islandchill_mo = mo;
    }

    if (sidebar && !sidebar._islandchill_ro && window.ResizeObserver) {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          if (width > 0) {
            const sw = document.getElementById(SWITCH_ID);
            if (sw) {
              if (width < 100) {
                sw.classList.add('is-collapsed');
              } else if (container && container.classList.contains('expanded')) {
                sw.classList.remove('is-collapsed');
              }
            }
          }
        }
      });
      ro.observe(sidebar);
      sidebar._islandchill_ro = ro;
    }
  };

  const installSwitchButton = () => {
    if (!canSwitchToMES()) return;
    installStyles();

    // Target 1: Desktop page header right-side actions
    const desktopTarget = document.querySelector('.desktop-navbar .desktop-notifications, header.desktop-navbar .desktop-notifications, .desktop-navbar .desktop-avatar, header.desktop-navbar .desktop-avatar');
    
    // Target 2: Standard Desk navbar right items or Desk Sidebar user button (#toolbar-user, .dropdown-navbar-user, .navbar .dropdown-notifications)
    const standardTarget = document.querySelector('#toolbar-user, .dropdown-navbar-user, .navbar .dropdown-notifications, .navbar-nav .dropdown-notifications');

    // Target 3: Generic navbar right flex (.navbar .ml-auto, .navbar-container > .flex, header .flex)
    const rightFlex = document.querySelector('.desktop-navbar > .flex:last-child, header.desktop-navbar > .flex:last-child, .navbar .ml-auto, .navbar-nav.ml-auto');

    let targetElement = null;
    let parentContainer = null;

    if (desktopTarget && desktopTarget.parentNode && !desktopTarget.closest('.desktop-search-wrapper')) {
      targetElement = desktopTarget;
      parentContainer = desktopTarget.parentNode;
    } else if (standardTarget && standardTarget.parentNode) {
      targetElement = standardTarget;
      parentContainer = standardTarget.parentNode;
    } else if (rightFlex) {
      parentContainer = rightFlex;
      targetElement = rightFlex.firstChild;
    }

    if (parentContainer) {
      const existing = document.getElementById(SWITCH_ID);
      if (!existing || !parentContainer.contains(existing)) {
        if (existing && existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }
        const item = createSwitchElement();
        if (targetElement && targetElement !== item) {
          parentContainer.insertBefore(item, targetElement);
        } else {
          parentContainer.appendChild(item);
        }
      }
    }

    // User dropdown menu item
    const userDropdown = document.querySelector('#toolbar-user .dropdown-menu, .dropdown-navbar-user .dropdown-menu, .notifications-list .header-actions');
    if (userDropdown && !document.getElementById(DROPDOWN_SWITCH_ID)) {
      const dropItem = document.createElement('li');
      dropItem.id = DROPDOWN_SWITCH_ID;
      dropItem.innerHTML = '<a class="dropdown-item" href="/islandchill?portal=mes" style="font-weight: 600; color: #b45309;">🏭 Switch to IslandChill MES</a>';
      userDropdown.insertBefore(dropItem, userDropdown.firstChild);
    }

    observeSidebar();
    updateCollapsedState();
  };

  const hookAboutDialog = () => {
    if (!window.frappe?.ui?.misc) return;
    if (frappe.ui.misc._islandchill_hooked) return;
    frappe.ui.misc._islandchill_hooked = true;

    const originalAbout = frappe.ui.misc.about;
    frappe.ui.misc.about = function () {
      originalAbout.apply(this, arguments);
      setTimeout(() => {
        const dialog = frappe.ui.misc.about_dialog;
        if (!dialog || !dialog.$wrapper) return;
        if (dialog.$wrapper.find('.about-islandchill-card').length) return;

        const switchCard = `
          <div class="about-islandchill-card" style="margin: 14px 0 10px; padding: 12px 14px; border-radius: 8px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.18)); border: 1px solid #d97706; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <div>
              <div style="font-weight: 700; color: #b45309; font-size: 13px;">IslandChill MES Operations</div>
              <div style="font-size: 11px; color: var(--text-muted, #64748b); margin-top: 1px;">Switch directly to the plant execution portal</div>
            </div>
            <a href="/islandchill?portal=mes" class="btn btn-sm" style="font-weight: 700; background: #d97706; color: #ffffff; border: none; border-radius: 6px; padding: 6px 14px; text-decoration: none; white-space: nowrap; box-shadow: 0 1px 3px rgba(217, 119, 6, 0.2);">
              🏭 Open IslandChill MES
            </a>
          </div>
        `;
        const $infoRows = dialog.$wrapper.find('.about-info-rows');
        if ($infoRows.length) {
          $infoRows.after(switchCard);
        } else {
          dialog.$wrapper.find('.about-body').append(switchCard);
        }
      }, 80);
    };
  };

  const setup = () => {
    installLogoutRedirect();
    installSwitchButton();
    hookAboutDialog();
    updateCollapsedState();
  };

  $(document).on('toolbar_setup page-change route app_ready sidebar-expand', () => {
    setup();
    setTimeout(updateCollapsedState, 50);
    setTimeout(updateCollapsedState, 350);
  });
  $(document).on('click', '.collapse-sidebar-link, .sidebar-toggle-btn', () => {
    setTimeout(updateCollapsedState, 50);
    setTimeout(updateCollapsedState, 350);
  });
  if (window.frappe && frappe.router) {
    frappe.router.on('change', setup);
  }
  $(setup);

  if (window.MutationObserver) {
    const observer = new MutationObserver(() => {
      const hasHeader = document.querySelector('.desktop-navbar, header.navbar, .navbar, #toolbar-user, .body-sidebar');
      const hasSwitch = document.getElementById(SWITCH_ID);
      if (hasHeader && (!hasSwitch || !document.body.contains(hasSwitch))) {
        setup();
      } else {
        updateCollapsedState();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  setInterval(() => {
    setup();
    updateCollapsedState();
  }, 1000);
})();
