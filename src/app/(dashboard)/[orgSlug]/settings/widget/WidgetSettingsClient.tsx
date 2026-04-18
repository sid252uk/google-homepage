"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, ExternalLink } from "lucide-react"

interface WidgetSettingsClientProps {
  widgetUrl: string
  iframeSnippet: string
  linkSnippet: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
      {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  )
}

export function WidgetSettingsClient({
  widgetUrl,
  iframeSnippet,
  linkSnippet,
}: WidgetSettingsClientProps) {
  return (
    <div className="space-y-6">
      {/* Direct URL */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Booking page URL
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono truncate">
            {widgetUrl}
          </code>
          <CopyButton text={widgetUrl} />
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <a href={widgetUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open
            </a>
          </Button>
        </div>
      </div>

      {/* Embed options */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Embed on your website
        </p>
        <Tabs defaultValue="iframe">
          <TabsList className="mb-3">
            <TabsTrigger value="iframe">iFrame embed</TabsTrigger>
            <TabsTrigger value="link">Simple link</TabsTrigger>
          </TabsList>
          <TabsContent value="iframe">
            <div className="relative">
              <pre className="rounded-md bg-muted p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {iframeSnippet}
              </pre>
              <div className="absolute top-2 right-2">
                <CopyButton text={iframeSnippet} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Paste this HTML anywhere on your website where you want the booking form to appear.
            </p>
          </TabsContent>
          <TabsContent value="link">
            <div className="relative">
              <pre className="rounded-md bg-muted p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {linkSnippet}
              </pre>
              <div className="absolute top-2 right-2">
                <CopyButton text={linkSnippet} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              A simple link that opens the booking page in a new tab.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Live preview
        </p>
        <div className="rounded-lg border overflow-hidden bg-muted/20">
          <iframe
            src={widgetUrl}
            width="100%"
            height="600"
            className="block"
            title="Booking widget preview"
          />
        </div>
      </div>
    </div>
  )
}
