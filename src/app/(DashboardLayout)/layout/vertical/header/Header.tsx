"use client";
import React, { useState, useEffect, useContext } from "react";
import { Navbar } from "flowbite-react";
import Search from "./Search";
import { Icon } from "@iconify/react";
import AppLinks from "./AppLinks";
import Notifications from "./Notifications";
import Profile from "./Profile";
import { CustomizerContext } from "@/app/context/CustomizerContext";
import { Language } from "./Language";
import FullLogo from "../../shared/logo/FullLogo";
import MobileHeaderItems from "./MobileHeaderItems";
import { Drawer } from "flowbite-react";
import MobileSidebar from "../sidebar/MobileSidebar";
import HorizontalMenu from "../../horizontal/header/HorizontalMenu";

interface HeaderPropsType {
  layoutType: string;
}

const Header = ({ layoutType }: HeaderPropsType) => {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const { setIsCollapse, isCollapse, isLayout, activeMode, setActiveMode, isMobileSidebar,setIsMobileSidebar } =
    useContext(CustomizerContext);

  const [mobileMenu, setMobileMenu] = useState("");

  const handleMobileMenu = () => {
    if (mobileMenu === "active") {
      setMobileMenu("");
    } else {
      setMobileMenu("active");
    }
  };

  const toggleMode = () => {
    setActiveMode((prevMode: string) =>
      prevMode === "light" ? "dark" : "light"
    );
  };

  // mobile-sidebar

  const handleClose = () => setIsMobileSidebar(false);
  return (
    <>
      <header
        className={`top-0 z-[5]  ${
          isSticky
            ? "bg-white dark:bg-darkgray sticky shadow-sm"
            : "bg-transparent"
        }`}
      >
        <Navbar
          fluid
          className={`rounded-none bg-transparent dark:bg-transparent py-3 sm:py-4 sm:px-[15px] px-2 ${
            layoutType == "horizontal" ? "container mx-auto !px-4 sm:!px-6" : ""
          }  ${isLayout == "full" ? "!max-w-full " : ""}`}
        >
          {/* Mobile Toggle Icon */}
          <span
            onClick={() => setIsMobileSidebar(true)}
            className="h-10 w-10 flex text-black dark:text-white text-opacity-65 xl:hidden hover:text-primary hover:bg-lightprimary rounded-full justify-center items-center cursor-pointer touch-target no-select"
            aria-label="Open menu"
          >
            <Icon icon="solar:hamburger-menu-line-duotone" height={21} />
          </span>
          {/* Toggle Icon   */}
          <Navbar.Collapse className="xl:block ">
            <div className="flex gap-3 items-center relative">
              {layoutType == "horizontal" ? (
                <div className="me-3">
                  <FullLogo />
                </div>
              ) : null}

              {/* App Link Dropwown   */}

              <Search />
            </div>
          </Navbar.Collapse>

          {/* mobile-logo */}
          <div className="block xl:hidden flex-1 flex justify-center">
            <FullLogo />
          </div>

          {/* Mobile right side actions */}
          <div className="flex xl:hidden items-center gap-1">
            {/* Theme Toggle - Mobile */}
            <span
              className="h-10 w-10 flex hover:text-primary hover:bg-lightprimary dark:hover:bg-darkminisidebar dark:hover:text-primary focus:ring-0 rounded-full justify-center items-center cursor-pointer text-darklink dark:text-white touch-target no-select"
              onClick={toggleMode}
              aria-label="Toggle theme"
            >
              <span className="flex items-center">
                <Icon icon={activeMode === "light" ? "solar:moon-line-duotone" : "solar:sun-bold-duotone"} width="20" />
              </span>
            </span>
            {/* Profile - Mobile */}
            <Profile />
          </div>

          <Navbar.Collapse className="xl:block hidden">
            <div className="flex gap-3 items-center">
              {/* Search   */}

              {/* Theme Toggle */}

              {/* Light Mode Button */}
              {activeMode === "light" ? (
                <div
                  className="h-10 w-10 hover:text-primary hover:bg-lightprimary dark:hover:bg-darkminisidebar  dark:hover:text-primary focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-darklink  dark:text-white"
                  onClick={toggleMode}
                >
                  <span className="flex items-center">
                    <Icon icon="solar:moon-line-duotone" width="20" />
                  </span>
                </div>
              ) : (
                // Dark Mode Button
                <div
                  className="h-10 w-10 hover:text-primary hover:bg-lightprimary dark:hover:bg-darkminisidebar  dark:hover:text-primary focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-darklink  dark:text-white"
                  onClick={toggleMode}
                >
                  <span className="flex items-center">
                    <Icon icon="solar:sun-bold-duotone" width="20" />
                  </span>
                </div>
              )}

              {/* Notification Dropdown */}
              {/* <Notifications /> */}

              {/* Language Dropdown*/}
              {/* <Language /> */}

              {/* Profile Dropdown */}
              <Profile />
            </div>
          </Navbar.Collapse>
        </Navbar>
        <div
          className={`w-full xl:hidden hidden mobile-header-menu ${mobileMenu}`}
        >
          {/* <MobileHeaderItems /> */}
        </div>

        {/* Horizontal Menu  */}
        {layoutType == "horizontal" ? (
          <div className="xl:border-t xl:border-ld">
            <div
              className={`${isLayout == "full" ? "w-full px-6" : "container"}`}
            >
              <HorizontalMenu />
            </div>
          </div>
        ) : null}
      </header>

      {/* Mobile Sidebar */}
      <Drawer open={isMobileSidebar} onClose={handleClose} className="w-130">
        <Drawer.Items>
          <MobileSidebar />
        </Drawer.Items>
      </Drawer>
    </>
  );
};

export default Header;