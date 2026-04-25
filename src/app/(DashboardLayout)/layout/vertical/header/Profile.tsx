import { Icon } from "@iconify/react";
import { Badge, Dropdown, Button } from "flowbite-react";
import React, { useEffect, useState } from "react";
import * as profileData from "./Data";
import Link from "next/link";
import Image from "next/image";
import SimpleBar from "simplebar-react";
import { useRouter } from "next/navigation";
import axiosServices from "@/utils/axios";
import { clearSession } from "@/utils/authSession";

const Profile = () => {
  const router = useRouter();
  const [userData, setUserData] = useState({
    username: "User",
    role: "User"
  });

  useEffect(() => {
    const username = localStorage.getItem("userName");
    const role = localStorage.getItem("userRole");
    if (username && role) {
      setUserData({ username, role });
    }
  }, []);

  const handleLogout = async () => {
    try {
      await axiosServices.post("/auth/logout", {}, { _skipAuthRefresh: true } as any);
    } catch (_error) {
      // Ignore logout API failure; local session is still cleared below.
    } finally {
      clearSession();
      
      router.push("/auth/auth1/login");
    }
  };

  return (
    <div className="relative ">
      <Dropdown
        label=""
        className="w-screen sm:w-[360px] pb-4 rounded-sm"
        dismissOnClick={false}
        renderTrigger={() => (
          <div className="flex items-center gap-1">
            <span className="h-10 w-10 hover:text-primary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary">
              <Image
                src="/images/profile/user-1.jpg"
                alt="logo"
                height="35"
                width="35"
                className="rounded-full"
              />
            </span>
            <Icon
              icon="solar:alt-arrow-down-bold"
              className="hover:text-primary dark:text-primary group-hover/menu:text-primary"
              height={12}
            />
          </div>
        )}
      >
        <div className="px-6">
          <div className="flex items-center gap-6 pb-5 border-b dark:border-darkborder mt-5 mb-3">
            <Image
              src="/images/profile/user-1.jpg"
              alt="logo"
              height="56"
              width="56"
              className="rounded-full"
            />
            <div>
              <h5 className="text-15 font-semibold">
                {userData.username} <span className="text-success">{userData.role}</span>
              </h5>
              <p className="text-sm text-ld opacity-80">{userData.username}@admin.com</p>
            </div>
          </div>
        </div>
        <SimpleBar>
          {profileData.profileDD.map((items, index) => (
            <div key={index} className="px-6 mb-2">
              <Dropdown.Item
                as={Link}
                href={items.url}
                className="px-3 py-2 flex justify-between items-center bg-hover group/link w-full rounded-md"
                key={index}
              >
                <div className="flex items-center w-full ">
                  <div className=" flex gap-3 w-full ">
                    <h5 className="text-15 font-normal group-hover/link:text-primary">
                      {items.title}
                    </h5>
                    {items.url == "/apps/invoice" ? (
                      <Badge color={"lightprimary"}>4</Badge>
                    ) : null}
                  </div>
                </div>
              </Dropdown.Item>
            </div>
          ))}
          <div className="px-6 mt-4">
            <Button
              color={"primary"}
              className="w-full text-center"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </SimpleBar>
      </Dropdown>
    </div>
  );
};

export default Profile;
