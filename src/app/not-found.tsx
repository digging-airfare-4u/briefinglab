import Link from "next/link"

import { SiteHeader } from "@/components/site/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="app-shell flex min-h-[70vh] items-center justify-center pb-20 pt-8">
        <Card className="glass-card max-w-xl gap-4 border-border/65 shadow-sm shadow-primary/5">
          <CardHeader className="space-y-3">
            <CardTitle className="font-heading text-3xl tracking-tight">
              这篇内容还没准备好。
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            可能是链接还没接入真实数据，也可能是这个示例页不存在。先回首页继续看今天的内容流。
            <div>
              <Button asChild>
                <Link href="/">返回首页</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
