"use client"

import Link from "next/link"
import { Menu } from "lucide-react"

import { ThemeToggle } from "@/components/site/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import type {
  CategoryFilter,
  CategoryOption,
} from "@/modules/content/public-content.view-model"

type SiteHeaderProps = {
  activeNav?: "home" | "latest" | "deep" | "about"
  categories?: CategoryOption[]
  activeCategory?: CategoryFilter
  onSelectCategory?: (category: CategoryFilter) => void
}

const navigationItems = [
  { href: "/", label: "首页", id: "home" },
  { href: "/latest", label: "快讯", id: "latest" },
  { href: "/deep", label: "深度", id: "deep" },
  { href: "/about", label: "关于", id: "about" },
] as const

export function SiteHeader({
  activeNav = "home",
  categories,
  activeCategory,
  onSelectCategory,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/78 supports-backdrop-filter:backdrop-blur-xl">
      <div className="app-shell flex h-18 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <nav className="hidden items-center gap-1 md:flex">
            {navigationItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant={activeNav === item.id ? "secondary" : "ghost"}
                className="text-sm"
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" className="md:hidden">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] max-w-sm">
              <SheetHeader className="px-0">
                <SheetTitle className="text-left">导航</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-2 px-4 pb-6">
                {navigationItems.map((item) => (
                  <Button
                    key={item.href}
                    asChild
                    variant={activeNav === item.id ? "secondary" : "ghost"}
                    className="justify-start"
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </div>

              {categories && onSelectCategory ? (
                <>
                  <Separator />
                  <div className="space-y-3 px-4 py-5">
                    <div className="text-sm font-medium text-foreground">内容分类</div>
                    <div className="flex flex-col gap-2">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-left transition-all ${
                            activeCategory === category.id
                              ? "bg-primary/8 text-foreground"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          }`}
                          onClick={() => onSelectCategory(category.id)}
                        >
                          <span className="font-medium">{category.label}</span>
                          <span className="font-mono text-xs">{category.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
