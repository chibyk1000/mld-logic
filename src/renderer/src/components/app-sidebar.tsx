import * as React from 'react'
import {
  Calculator,
  Cog,
  DollarSign,
  Group,
  LayoutDashboard,
  Package,
  PackageOpen,
  StoreIcon,
  Users,
  UserSquare
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from '@renderer/components/ui/sidebar'
;('use client')
import Logo  from "../assets/logo-no-bg.png"
import { ChevronRight, type LucideIcon } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@renderer/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@renderer/components/ui/sidebar'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '@renderer/lib/utils'

export function NavMain({
  items
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: { title: string; url: string }[]
  }[]
}) {
  const pathname = useLocation()

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = '#' + pathname.pathname === item.url

          const activeStyle = 'bg-accent text-white text-primary font-semibold rounded-xl '

          const baseItem =
            'text-white hover:bg-white/10 rounded-xl transition-colors h-12 text-[15px]'

          // ------------------------------------
          // COLLAPSIBLE ITEM
          // ------------------------------------
          if (item.items) {
            console.log(pathname.pathname, item.url)
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={cn(
                        baseItem,
                        'flex items-center gap-3 px-4 hover:bg-accent hover:text-white rou',
                        isActive && activeStyle
                      )}
                    >
                      {item.icon && <item.icon size={20} />}
                      <span>{item.title}</span>

                      <ChevronRight
                        size={18}
                        className="ml-auto transition-transform duration-200 
                        group-data-[state=open]/collapsible:rotate-90"
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  {/* SUBMENU */}
                  <CollapsibleContent>
                    <SidebarMenuSub className="pl-6 mt-1 space-y-1">
                      {item.items?.map((sub) => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild>
                            <NavLink
                              to={sub.url}
                              className={cn(
                                'text-white/80 hover:text-white block py-2 pl-3',
                                isActive && activeStyle
                              )}
                            >
                              {sub.title}
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          // ------------------------------------
          // SIMPLE ITEM
          // ------------------------------------
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className={cn(
                  baseItem,
                  'flex items-center gap-3 px-4 hover:bg-accent hover:text-white',
                  item.isActive && activeStyle
                )}
              >
                <Link to={item.url}>
                  {item.icon && <item.icon size={20} />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

// This is sample data.
const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard
    },
    {
      title: 'Warehouse',
      url: '/warehouses',
      icon: StoreIcon
    },
    {
      title: 'Agents',
      url: '/agents',
      icon: Group
    },
    { title: 'Inventory', url: '/inventory', icon: Package },
    { title: 'Orders', url: '/orders', icon: PackageOpen },
    { title: 'Remittance', url: '/remittance', icon: DollarSign },
    { title: 'VIP Clients', url: '/vip-clients', icon: Users },
    { title: 'Regular Clients', url: '/regular-clients', icon: UserSquare },
    { title: 'Accounting', url: '/accounting', icon: Calculator },
    { title: 'Settings', url: '/settings', icon: Cog }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex items-center justify-center py-4">
        {/* Logo that adapts on collapse */}
        <img
          src={Logo}
          alt="logo"
          className="transition-all object-contain rounded-xl 
                      bg-white 
                      h-20 w-auto
                      sidebar-logo"
        />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter />

      <SidebarRail />
    </Sidebar>
  )
}
