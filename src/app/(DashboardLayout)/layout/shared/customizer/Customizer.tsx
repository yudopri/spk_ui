"use client";
import React, { useContext } from "react";
import { Button, Drawer, RangeSlider, Tooltip } from "flowbite-react";
import { Icon } from "@iconify/react";
import { CustomizerContext } from "@/app/context/CustomizerContext";
import { useState } from "react";
import { IconCheck, IconSettings } from "@tabler/icons-react";
import SimpleBar from "simplebar-react";

export const Customizer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = () => setIsOpen(false);
  interface SliderProps {
    value: number;
    min: number;
    max: number;
    valueLabelDisplay: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }
  const addAttributeToBody = (cvalue: any) => {
    document.body.setAttribute("data-color-theme", cvalue);
  };

  const Slider: React.FC<SliderProps> = ({
    value,
    min,
    max,
    valueLabelDisplay,
    onChange,
  }) => (
    <input
      type="range"
      value={value}
      min={10}
      max={max}
      onChange={onChange}
      className="slider w-full "
    />
  );

  const {
    activeDir,
    setActiveDir,
    activeMode,
    setActiveMode,
    isCollapse,
    setIsCollapse,
    activeTheme,
    setActiveTheme,
    activeLayout,
    setActiveLayout,
    isLayout,
    isCardShadow,
    setIsCardShadow,
    setIsLayout,
    isBorderRadius,
    setIsBorderRadius,
  } = useContext(CustomizerContext);

  const themeColors = [
    {
      id: 1,
      bgColor: "#635BFF",
      disp: "BLUE_THEME",
    },
    {
      id: 2,
      bgColor: "#0074BA",
      disp: "AQUA_THEME",
    },
    {
      id: 3,
      bgColor: "#763EBD",
      disp: "PURPLE_THEME",
    },
    {
      id: 4,
      bgColor: "#0A7EA4",
      disp: "GREEN_THEME",
    },
    {
      id: 5,
      bgColor: "#01C0C8",
      disp: "CYAN_THEME",
    },
    {
      id: 6,
      bgColor: "#FA896B",
      disp: "ORANGE_THEME",
    },
  ];

  return (
    <div>
      <div>
        <Button
          color={"primary"}
          className="h-12 w-12 sm:h-14 sm:w-14 flex justify-center items-center fixed bottom-5 end-5 sm:bottom-6 sm:end-6 rounded-xl hover:bg-primaryemphasis shadow-lg z-50"
          onClick={() => setIsOpen(true)}
        >
          <IconSettings className="sm:hidden" width={20} />
          <IconSettings className="hidden sm:block" />
        </Button>
      </div>
      <Drawer
        open={isOpen}
        onClose={handleClose}
        position={`${activeDir === "rtl" ? "left" : "right"}`}
        className="dark:bg-darkgray w-full sm:max-w-[350px]"
      >
        <div className="border-ld border-b">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center gap-2">
              <Icon icon="solar:settings-bold-duotone" className="text-primary" width={22} />
              <h5 className="text-lg font-bold text-dark dark:text-white">Pengaturan Tampilan</h5>
            </div>
            <span
              onClick={handleClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-lightprimary cursor-pointer text-slate-400 hover:text-primary transition-colors"
            >
              <Icon icon="solar:close-bold" width={18} />
            </span>
          </div>
        </div>
        <SimpleBar className="h-[calc(100vh-60px)]">
          <div className="p-4">
            {/* Theme Option */}
            <h4 className="text-sm font-semibold mb-3 text-dark dark:text-white uppercase tracking-wider">Tema</h4>
            <div className="flex gap-3 mb-7">
              <Button
                color={"primary"}
                className={`border bg-transparent text-darklink btn-shadow border-ld  dark:text-white  hover:bg-primary hover:text-white rounded-md py-3 px-3 dark:hover:text-white 
                ${
                  activeMode === "light"
                    ? "active text-primary bg-lightprimary hover:bg-lightprimary hover:text-primary "
                    : "dark:hover:bg-darkminisidebar "
                }`}
                onClick={() => {
                  setActiveMode("light");
                }}
              >
                <span className="flex items-center">
                  <Icon
                    icon="solar:sun-bold-duotone"
                    width="20"
                    className="me-2"
                  />
                  Light
                </span>
              </Button>
              <Button
                color={"primary"}
                className={`border bg-transparent dark:text-white border-ld text-darklink hover:bg-primary  dark:hover:text-white hover:text-white rounded-md py-3 px-3 ${
                  activeMode === "dark"
                    ? "active text-primary bg-lightprimary   dark:bg-darkminisidebar dark:text-white"
                    : "hover:bg-lightprimary hover:text-primary"
                }`}
                onClick={() => {
                  setActiveMode("dark");
                }}
              >
                <span className="flex items-center">
                  <Icon
                    icon="solar:moon-bold-duotone"
                    width="20"
                    className="me-2"
                  />{" "}
                  Dark
                </span>
              </Button>
            </div>

            {/* Theme direction */}
            <h4 className="text-sm font-semibold mb-3 text-dark dark:text-white uppercase tracking-wider">Arah Layout</h4>
            <div className="flex gap-3 mb-7">
              <Button
                color={"primary"}
                className={`border bg-transparent text-darklink dark:text-white border-ld  hover:bg-primary hover:text-white rounded-md py-3 px-3  dark:hover:text-white ${
                  activeDir === "ltr"
                    ? "text-primary bg-lightprimary dark:text-white dark:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                    : "dark:hover:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                }`}
                onClick={() => {
                  setActiveDir("ltr");
                }}
              >
                <span className="flex items-center">
                  <Icon
                    icon="solar:align-left-line-duotone"
                    width="20"
                    className="me-2"
                  />{" "}
                  LTR
                </span>
              </Button>
              <Button
                color={"primary"}
                className={`border bg-transparent btn-shadow border-ld text-darklink dark:text-white hover:bg-primary hover:text-white rounded-md py-3 px-3 ${
                  activeDir === "rtl"
                    ? "text-primary bg-lightprimary  dark:text-white dark:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                    : "dark:hover:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                }`}
                onClick={() => {
                  setActiveDir("rtl");
                }}
              >
                <span className="flex items-center">
                  <Icon
                    icon="solar:align-right-line-duotone"
                    width="20"
                    className="me-2"
                  />{" "}
                  RTL
                </span>
              </Button>
            </div>

            {/* Theme Colors */}
            <h4 className="text-sm font-semibold mb-3 text-dark dark:text-white uppercase tracking-wider">Warna Tema</h4>
            <div className="flex flex-row flex-wrap gap-4 mb-7">
              {themeColors.map((theme, index) => (
                <span
                  key={index}
                  onClick={() => addAttributeToBody(theme.disp)}
                  className="border bg-transparent text-link dark:text-white border-ld py-5 px-6 rounded-md cursor-pointer "
                >
                  <Tooltip
                    content={theme.disp}
                    placement="top"
                    animation="duration-500"
                  >
                    <label
                      className=" h-6 w-6 rounded-full block cursor-pointer flex items-center justify-center"
                      style={{ backgroundColor: theme.bgColor }}
                      onClick={() => setActiveTheme(theme.disp)}
                    >
                      {activeTheme === theme.disp && (
                        <IconCheck className="text-white" size={18} />
                      )}
                    </label>
                  </Tooltip>
                </span>
              ))}
            </div>

            {/* Theme layout */}
            <h4 className="text-sm font-semibold mb-3 text-dark dark:text-white uppercase tracking-wider">Jenis Layout</h4>
            <div className="flex flex-wrap gap-3 mb-7">
              <Button
                color={"primary"}
                className={`border bg-transparent btn-shadow border-ld text-darklink dark:text-white hover:bg-primary hover:text-white rounded-md py-3 px-2  dark:hover:text-white ${
                  activeLayout === "vertical"
                    ? "text-primary bg-lightprimary dark:text-white dark:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                    : "dark:hover:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                }`}
                onClick={() => setActiveLayout("vertical")}
              >
                <span className="flex items-center">
                  <Icon
                    icon="solar:slider-vertical-line-duotone"
                    width="20"
                    className="me-2"
                  />
                  Vertical
                </span>
              </Button>
              <Button
                color={"primary"}
                onClick={() => setActiveLayout("horizontal")}
                className={`border bg-transparent text-link dark:text-white border-ld text-darklink hover:bg-primary hover:text-white rounded-md py-3 px-2 ${
                  activeLayout === "horizontal"
                    ? "text-primary bg-lightprimary  dark:text-white dark:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                    : "dark:hover:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                }`}
              >
                <span className="flex items-center">
                  <Icon
                    icon="solar:slider-horizontal-line-duotone"
                    width="20"
                    className="me-2"
                  />
                  Horizontal
                </span>
              </Button>
            </div>

            {/* Sidebar Type */}
            <h4 className="text-sm font-semibold mb-3 text-dark dark:text-white uppercase tracking-wider">Container</h4>
            <div className="flex flex-wrap gap-3 mb-7">
              <Button
                color={"primary"}
                className={`border bg-transparent btn-shadow border-ld text-darklink dark:text-white hover:bg-primary hover:text-white rounded-md py-3 px-2   dark:hover:text-white ${
                  isLayout === "boxed"
                    ? "text-primary bg-lightprimary  dark:text-white dark:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                    : "dark:hover:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                }`}
                onClick={() => setIsLayout("boxed")}
              >
                <span className="flex items-center">
                  <Icon
                    icon="solar:quit-full-screen-square-line-duotone"
                    width="20"
                    className="me-2"
                  />
                  Boxed
                </span>
              </Button>
              <Button
                color={"primary"}
                className={`border bg-transparent text-link dark:text-white border-ld text-darklink hover:bg-primary hover:text-white rounded-md py-3 px-2 ${
                  isLayout === "full"
                    ? "text-primary bg-lightprimary  dark:text-white dark:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                    : "dark:hover:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                }`}
                onClick={() => setIsLayout("full")}
              >
                <span className="flex items-center">
                  <Icon
                    icon="solar:full-screen-square-line-duotone"
                    width="20"
                    className="me-2"
                  />
                  Full
                </span>
              </Button>
            </div>

            {/* Sidebar Type */}
            <h4 className="text-sm font-semibold mb-3 text-dark dark:text-white uppercase tracking-wider">Tipe Sidebar</h4>
            <div className="flex flex-wrap gap-3 mb-7">
              <Button
                color={"primary"}
                className={`border bg-transparent btn-shadow border-ld text-darklink dark:text-white hover:bg-primary hover:text-white rounded-md py-3 px-2   dark:hover:text-white ${
                  isCollapse == "full-sidebar"
                    ? "text-primary bg-lightprimary  dark:text-white dark:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                    : "dark:hover:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                }`}
                onClick={() => setIsCollapse("full-sidebar")}
              >
                <span className="flex items-center">
                  <Icon
                    icon="solar:mirror-left-line-duotone"
                    width="20"
                    className="me-2"
                  />
                  Full
                </span>
              </Button>
              <Button
                color={"primary"}
                className={`border bg-transparent text-link dark:text-white border-ld text-darklink hover:bg-primary hover:text-white rounded-md py-3 px-2 ${
                  isCollapse == "mini-sidebar"
                    ? "text-primary bg-lightprimary  dark:text-white dark:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                    : "dark:hover:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                }`}
                onClick={() => setIsCollapse("mini-sidebar")}
              >
                <span className="flex items-center">
                  <Icon
                    icon="solar:mirror-right-line-duotone"
                    width="20"
                    className="me-2"
                  />
                  Collapse
                </span>
              </Button>
            </div>

            {/* Card  With */}
            <h4 className="text-sm font-semibold mb-3 text-dark dark:text-white uppercase tracking-wider">Tampilan Kartu</h4>
            <div className="flex flex-wrap gap-3 mb-7">
              <Button
                color={"primary"}
                className={`border bg-transparent btn-shadow border-ld text-darklink dark:text-white hover:bg-primary hover:text-white rounded-md py-3 px-2  ${
                  !isCardShadow
                    ? "text-primary bg-lightprimary  dark:text-white dark:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                    : "dark:hover:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                }`}
                onClick={() => setIsCardShadow(false)}
              >
                <span className="flex items-center">
                  <Icon
                    icon="solar:three-squares-line-duotone"
                    width="20"
                    className="me-2"
                  />
                  Border
                </span>
              </Button>
              <Button
                color={"primary"}
                className={`border bg-transparent text-link dark:text-white border-ld text-darklink hover:bg-primary hover:text-white rounded-md py-3 px-2 dark:hover:text-white ${
                  isCardShadow
                    ? "text-primary bg-lightprimary  dark:text-white dark:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                    : "dark:hover:bg-darkminisidebar hover:bg-lightprimary hover:text-primary"
                }`}
                onClick={() => setIsCardShadow(true)}
              >
                <span className="flex items-center">
                  <Icon
                    icon="solar:three-squares-bold-duotone"
                    width="20"
                    className="me-2"
                  />
                  Shadow
                </span>
              </Button>
            </div>

            {/* Card  With */}
            <h4 className="text-sm font-semibold mb-3 text-dark dark:text-white uppercase tracking-wider">Border Radius</h4>
            <RangeSlider
              id="default-range"
              value={isBorderRadius}
              min={4}
              max={24}
              onChange={(event: any) => setIsBorderRadius(event.target.value)}
            />
            <div>
              <p className="dark:text-applinksubtext">
                Current Value: {isBorderRadius}
              </p>
            </div>
          </div>
        </SimpleBar>
      </Drawer>
    </div>
  );
};
