import { Layout } from "@/components/Layout";
import { CommonDocsSection } from "@/components/CommonDocsSection";

export default function TeamFeed() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Feed</h1>
          <p className="text-muted-foreground mt-1">
            Share updates, record notes, and auto-assign tasks to the team.
          </p>
        </div>

        <div className="max-w-4xl">
          <CommonDocsSection />
        </div>
      </div>
    </Layout>
  );
}
