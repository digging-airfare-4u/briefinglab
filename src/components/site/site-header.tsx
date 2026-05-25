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
        <div className="flex items-center gap-6 lg:gap-8">
          <Link
            href="/"
            aria-label="AI 资讯 · 首页"
            className="group flex items-center gap-2.5"
          >
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-[0.8rem] bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/25 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-[1.06]">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-[18px]"
                aria-hidden="true"
              >
                <rect x="4" y="5" width="16" height="2.6" rx="1.3" />
                <rect x="4" y="10.7" width="11" height="2.6" rx="1.3" opacity="0.82" />
                <rect x="4" y="16.4" width="14" height="2.6" rx="1.3" opacity="0.62" />
              </svg>
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-heading text-[0.95rem] font-bold tracking-tight text-foreground">
                AI 资讯
              </span>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground transition-colors group-hover:text-primary/80">
                DAILY DIGEST
              </span>
            </span>
          </Link>

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
