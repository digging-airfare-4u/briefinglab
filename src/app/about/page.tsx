import { SiteHeader } from "@/components/site/site-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const principles = [
  {
    title: "先给摘要，再给原文",
    description:
      "站内的主要价值不是替代原始来源，而是先把信息整理成更容易判断的阅读入口。",
  },
  {
    title: "按日期看上下文，而不是只看热度",
    description:
      "AI 资讯的价值常常来自连续变化。日期分组能帮助用户判断信号是在增强还是只是一次性噪音。",
  },
  {
    title: "产品感来自节奏，而不是堆功能",
    description:
      "首页保留左侧分类与右侧精选，不是为了复杂，而是为了让浏览效率和编辑感同时成立。",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader activeNav="about" />
      <main className="app-shell space-y-8 pb-20 pt-8">
        <Card className="glass-card gap-4 border-border/65 shadow-sm shadow-primary/5">
          <CardHeader className="space-y-3">
            <Badge className="w-fit rounded-full bg-primary/8 text-primary hover:bg-primary/8">
              关于项目
            </Badge>
            <CardTitle className="font-heading text-3xl tracking-tight">
              我们想做的，不是更嘈杂，而是更清晰。
            </CardTitle>
          </CardHeader>
          <CardContent className="max-w-3xl text-sm leading-8 text-muted-foreground">
            这个项目是一套面向技术读者的 AI 资讯聚合体验。Phase 1 会先跑通内容采集、归一化、摘要和公共 API，再逐步扩展为更完整的编辑型产品。
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          {principles.map((principle) => (
            <Card key={principle.title} className="glass-card gap-4 border-border/65 shadow-sm shadow-primary/5">
              <CardHeader>
                <CardTitle className="text-xl">{principle.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                {principle.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
