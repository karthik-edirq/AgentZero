"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Plus, Trash2, Download } from "lucide-react"
import { Input } from "@/components/ui/input"

interface EmailImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (emails: Array<{ email: string; name?: string; role?: string }>) => void
}

export function EmailImportModal({ open, onOpenChange, onImport }: EmailImportModalProps) {
  const [importMethod, setImportMethod] = useState<"excel" | "manual">("manual")
  const [emails, setEmails] = useState<Array<{ email: string; name?: string; role?: string }>>([])
  const [currentEmail, setCurrentEmail] = useState({ email: "", name: "", role: "" })

  const handleAddEmail = () => {
    if (currentEmail.email.trim()) {
      setEmails([
        ...emails,
        { email: currentEmail.email, name: currentEmail.name || undefined, role: currentEmail.role || undefined },
      ])
      setCurrentEmail({ email: "", name: "", role: "" })
    }
  }

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index))
  }

  const handleImport = () => {
    onImport(emails)
    setEmails([])
    onOpenChange(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string
        const lines = csv.split("\n").filter((line) => line.trim())
        const newEmails = lines.slice(1).map((line) => {
          const [email, name, role] = line.split(",").map((s) => s.trim())
          return { email, name, role }
        })
        setEmails((prev) => [...prev, ...newEmails.filter((e) => e.email)])
      } catch (err) {
        console.error("Error parsing CSV:", err)
      }
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Bulk Emails</DialogTitle>
          <DialogDescription>Add recipients in bulk via Excel or manual entry</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Method Tabs */}
          <div className="flex gap-2">
            <Button
              variant={importMethod === "manual" ? "default" : "outline"}
              onClick={() => setImportMethod("manual")}
              className={importMethod === "manual" ? "bg-primary text-primary-foreground" : ""}
            >
              Manual Entry
            </Button>
            <Button
              variant={importMethod === "excel" ? "default" : "outline"}
              onClick={() => setImportMethod("excel")}
              className={importMethod === "excel" ? "bg-primary text-primary-foreground" : ""}
            >
              Excel Import
            </Button>
          </div>

          {/* Excel Upload */}
          {importMethod === "excel" && (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Upload CSV or Excel file</p>
              <p className="text-xs text-muted-foreground mt-1">Format: email, name, role (optional)</p>
              <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} className="hidden" id="file-upload" />
              <Button asChild variant="outline" className="mt-4 bg-transparent">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </label>
              </Button>
              <Button variant="outline" className="mt-2 ml-2 bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          )}

          {/* Manual Entry */}
          {importMethod === "manual" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Email address"
                  type="email"
                  value={currentEmail.email}
                  onChange={(e) => setCurrentEmail({ ...currentEmail, email: e.target.value })}
                  className="bg-secondary border-border"
                />
                <Input
                  placeholder="Name (optional)"
                  value={currentEmail.name}
                  onChange={(e) => setCurrentEmail({ ...currentEmail, name: e.target.value })}
                  className="bg-secondary border-border"
                />
                <Input
                  placeholder="Role (optional)"
                  value={currentEmail.role}
                  onChange={(e) => setCurrentEmail({ ...currentEmail, role: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <Button
                onClick={handleAddEmail}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Email
              </Button>
            </div>
          )}

          {/* Email List */}
          {emails.length > 0 && (
            <Card className="bg-secondary border border-border">
              <div className="p-4">
                <p className="text-sm font-semibold text-foreground mb-3">
                  {emails.length} email{emails.length !== 1 ? "s" : ""} ready to import
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {emails.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-background p-3 rounded border border-border"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.email}</p>
                        <div className="flex gap-2 mt-1">
                          {item.name && (
                            <Badge variant="outline" className="text-xs">
                              {item.name}
                            </Badge>
                          )}
                          {item.role && (
                            <Badge variant="outline" className="text-xs">
                              {item.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEmail(idx)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={emails.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Import {emails.length} Email{emails.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
