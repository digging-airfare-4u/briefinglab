"use client"

import type {
  CategoryFilter,
  CategoryOption,
} from "@/modules/content/public-content.view-model"

type CategorySidebarProps = {
  categories: CategoryOption[]
  activeCategory: CategoryFilter
  onSelectCategory: (category: CategoryFilter) => void
}

export function CategorySidebar({
  categories,
  activeCategory,
  onSelectCategory,
}: CategorySidebarProps) {
  return (
    <aside className="sticky top-24">
      <div className="mb-3 px-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          分类
        </p>
      </div>
      <div className="space-y-1.5">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.id)}
            className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition-all ${
              activeCategory === category.id
                ? "bg-primary/8 text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <span className="font-medium">{category.label}</span>
            <span className="font-mono text-xs">{category.count}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
