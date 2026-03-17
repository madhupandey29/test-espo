'use client';
import React, { useState, useRef, useEffect } from "react";
import primaryNavigation from "@/data/menu-data";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { navigateCapabilityLink } from "@/utils/capability-navigation";
import {
  FaIndustry,
  FaCogs,
  FaTools,
  FaFlask,
  FaAward,
  FaChevronDown,
} from 'react-icons/fa';

const CAPABILITY_ICONS = {
  FaIndustry,
  FaCogs,
  FaTools,
  FaFlask,
  FaAward,
};

const Menus = () => {
  const router = useRouter();
  const [openMegaMenu, setOpenMegaMenu] = useState(null);
  const menuTimeoutRef = useRef(null);

  const getIconComponent = (iconName) => {
    return CAPABILITY_ICONS[iconName] || FaIndustry;
  };

  const handleMenuClose = () => {
    setOpenMegaMenu(null);
  };

  const clearMenuTimeout = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
  };

  const forceCloseMegaMenu = (menuElement) => {
    setOpenMegaMenu(null);
    clearMenuTimeout();

    if (menuElement) {
      menuElement.classList.remove('menu-open', 'hover');
      menuElement.style.pointerEvents = 'none';

      setTimeout(() => {
        menuElement.style.pointerEvents = '';
      }, 500);
    }

    const allMegaMenus = document.querySelectorAll('.capabilities-mega-grid-compact');
    allMegaMenus.forEach((menu) => {
      menu.classList.remove('show');
      menu.style.opacity = '0';
      menu.style.visibility = 'hidden';
      menu.style.pointerEvents = 'none';
    });
  };

  const handleCapabilityClick = (link, event) => {
    event.preventDefault();
    event.stopPropagation();

    navigateCapabilityLink({
      link,
      router,
      onBeforeNavigate: () =>
        forceCloseMegaMenu(event.currentTarget.closest('.has-mega-menu')),
    });
  };

  const handleRegularClick = () => {
    handleMenuClose();
  };

  const handleMouseEnter = (menuId) => {
    clearMenuTimeout();
    setOpenMegaMenu(menuId);
  };

  const handleMouseLeave = (event) => {
    if (
      event.relatedTarget &&
      event.relatedTarget.nodeType === Node.ELEMENT_NODE &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    menuTimeoutRef.current = setTimeout(() => {
      setOpenMegaMenu(null);
    }, 300);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.has-mega-menu')) {
        setOpenMegaMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      setOpenMegaMenu(null);
    };

    window.addEventListener('beforeunload', handleRouteChange);

    return () => {
      window.removeEventListener('beforeunload', handleRouteChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearMenuTimeout();
    };
  }, []);

  return (
    <ul>
      {primaryNavigation.map((menu) =>
        menu.homes ? (
          <li key={menu.id} className="has-dropdown has-mega-menu">
            <Link href={menu.link}>{menu.title}</Link>
            <div className="home-menu tp-submenu tp-mega-menu">
              <div className="row row-cols-1 row-cols-lg-4 row-cols-xl-4">
                {menu.home_pages.map((home) => (
                  <div key={home.link} className="col">
                    <div className="home-menu-item">
                      <Link href={home.link}>
                        <div className="home-menu-thumb p-relative fix">
                          <Image src={home.img} alt="home img" />
                        </div>
                        <div className="home-menu-content">
                          <h5 className="home-menu-title">{home.title}</h5>
                        </div>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </li>
        ) : menu.capabilities ? (
          <li
            key={menu.id}
            className={`has-dropdown has-mega-menu ${openMegaMenu === menu.id ? 'menu-open' : ''}`}
            onMouseEnter={() => handleMouseEnter(menu.id)}
            onMouseLeave={handleMouseLeave}
          >
            <Link href={menu.link} onClick={(event) => handleCapabilityClick(menu.link, event)}>
              {menu.title}
              <FaChevronDown className="dropdown-icon" />
            </Link>
            <div
              className={`capabilities-mega-grid-compact tp-submenu tp-mega-menu ${openMegaMenu === menu.id ? 'show' : ''}`}
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setOpenMegaMenu(null);
                }
              }}
            >
              <div className="capabilities-header">
                <h4>Our Capabilities</h4>
              </div>

              <div className="capabilities-content">
                <div className="capabilities-boxes-compact-grid">
                  {menu.capability_pages.map((capability) => {
                    const IconComponent = getIconComponent(capability.icon);
                    return (
                      <div key={capability.id} className="capability-compact-box">
                        <Link
                          href={capability.link}
                          className="capability-compact-link"
                          onClick={(event) => handleCapabilityClick(capability.link, event)}
                        >
                          <div className="capability-compact-icon">
                            <IconComponent />
                          </div>
                          <div className="capability-compact-content">
                            <h5 className="capability-compact-title">{capability.title}</h5>
                            <p className="capability-compact-desc">{capability.description}</p>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="capabilities-footer-cta">
                <Link
                  href="/capabilities"
                  className="view-all-compact-btn"
                  onClick={(event) => handleCapabilityClick('/capabilities', event)}
                >
                  View All Capabilities
                </Link>
              </div>
            </div>
          </li>
        ) : menu.products ? (
          <li key={menu.id} className="has-dropdown has-mega-menu ">
            <Link href={menu.link}>{menu.title}</Link>
            <ul className="tp-submenu tp-mega-menu mega-menu-style-2">
              {menu.product_pages.map((productPage) => (
                <li key={productPage.link} className="has-dropdown">
                  <Link href={productPage.link} className="mega-menu-title">
                    {productPage.title}
                  </Link>
                  <ul className="tp-submenu">
                    {productPage.mega_menus.map((megaMenuItem) => (
                      <li key={megaMenuItem.link}>
                        <Link href={megaMenuItem.link}>{megaMenuItem.title}</Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        ) : menu.sub_menu ? (
          <li key={menu.id} className="has-dropdown">
            <Link href={menu.link} onClick={handleRegularClick}>{menu.title}</Link>
            <ul className="tp-submenu">
              {menu.sub_menus.map((subMenu) => (
                <li key={subMenu.link}>
                  <Link href={subMenu.link} onClick={handleRegularClick}>{subMenu.title}</Link>
                </li>
              ))}
            </ul>
          </li>
        ) : (
          <li key={menu.id}>
            <Link href={menu.link} onClick={handleRegularClick}>{menu.title}</Link>
          </li>
        )
      )}
    </ul>
  );
};

export default Menus;
