"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Database, Plus, X, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingFetchingEmailsAnimation } from "./loading-animations"

interface AddRecipientsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: {
    organization: string
    emails: Array<{ email: string; name?: string; role?: string; businessFunction?: string }>
  }) => void
}

export function AddRecipientsModal({ open, onOpenChange, onSubmit }: AddRecipientsModalProps) {
  const [organization, setOrganization] = useState("")
  const [defaultBusinessFunction, setDefaultBusinessFunction] = useState("")
  const [importMethod, setImportMethod] = useState<"excel" | "manual">("manual")
  const [emails, setEmails] = useState<Array<{ email: string; name?: string; role?: string; businessFunction?: string }>>([])
  const [currentEmail, setCurrentEmail] = useState({ email: "", name: "", role: "", businessFunction: "" })
  const [isUploading, setIsUploading] = useState(false)

  const handleAddEmail = () => {
    if (currentEmail.email.trim()) {
      setEmails([
        ...emails,
        {
          email: currentEmail.email,
          name: currentEmail.name || undefined,
          role: currentEmail.role || undefined,
          // Use individual businessFunction if set, otherwise use default
          businessFunction: currentEmail.businessFunction || defaultBusinessFunction || undefined,
        },
      ])
      // Reset individual fields but keep default business function
      setCurrentEmail({ email: "", name: "", role: "", businessFunction: "" })
    }
  }

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string
        const lines = csv.split("\n").filter((line) => line.trim())
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
        const emailIndex = headers.findIndex((h) => h.includes("email"))
        const nameIndex = headers.findIndex((h) => h.includes("name"))
        const roleIndex = headers.findIndex((h) => h.includes("role"))
        const businessFunctionIndex = headers.findIndex((h) => h.includes("business") || h.includes("function"))

        const newEmails = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim())
          return {
            email: values[emailIndex] || "",
            name: nameIndex >= 0 ? values[nameIndex] : undefined,
            role: roleIndex >= 0 ? values[roleIndex] : undefined,
            // Use CSV value if present, otherwise use default business function
            businessFunction: businessFunctionIndex >= 0 && values[businessFunctionIndex] 
              ? values[businessFunctionIndex] 
              : (defaultBusinessFunction || undefined),
          }
        })

        setEmails((prev) => [...prev, ...newEmails.filter((e) => e.email)])
      } catch (err) {
        console.error("Error parsing CSV:", err)
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization || emails.length === 0) return

    setIsUploading(true)
    try {
      const response = await fetch("/api/recipients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organization,
          emails,
        }),
      })

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      if (onSubmit) {
        onSubmit({ organization, emails })
      }

      // Reset form
      setOrganization("")
      setDefaultBusinessFunction("")
      setEmails([])
      setCurrentEmail({ email: "", name: "", role: "", businessFunction: "" })
      setImportMethod("manual")
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error adding recipients:", error)
      alert(`Failed to add recipients: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setOrganization("")
    setDefaultBusinessFunction("")
    setEmails([])
    setCurrentEmail({ email: "", name: "", role: "", businessFunction: "" })
    setImportMethod("manual")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Add Recipients</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add new recipients to your Supabase database. They will be available for all campaigns in the selected organization.
          </DialogDescription>
        </DialogHeader>

        {isUploading ? (
          <Card className="bg-secondary border border-border p-8">
            <LoadingFetchingEmailsAnimation progress={emails.length} total={emails.length} />
            <p className="text-center text-sm text-muted-foreground mt-4">
              Uploading {emails.length} recipient{emails.length !== 1 ? "s" : ""} to Supabase...
            </p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Organization */}
            <div className="space-y-2">
              <Label htmlFor="organization" className="text-sm font-medium text-foreground">
                Organization
              </Label>
              <Select value={organization} onValueChange={setOrganization} required>
                <SelectTrigger
                  id="organization"
                  className="w-full bg-secondary border-border text-foreground"
                >
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acme-corp">Acme Corporation</SelectItem>
                  <SelectItem value="tech-startup">Tech Startup Inc.</SelectItem>
                  <SelectItem value="finance-group">Finance Group Ltd.</SelectItem>
                  <SelectItem value="healthcare-sys">Healthcare Systems</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Business Function */}
            <div className="space-y-2">
              <Label htmlFor="business-function" className="text-sm font-medium text-foreground">
                Business Function
              </Label>
              <Select
                value={currentEmail.businessFunction}
                onValueChange={(value) => {
                  setCurrentEmail({ ...currentEmail, businessFunction: value })
                }}
              >
                <SelectTrigger
                  id="business-function"
                  className="w-full bg-secondary border-border text-foreground"
                >
                  <SelectValue placeholder="Select function (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="hr">Human Resources</SelectItem>
                  <SelectItem value="it">IT Department</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This will be applied to all recipients you add. You can override for individual recipients below.
              </p>
            </div>

            {/* Import Method */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-foreground">Import Method</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={importMethod === "excel" ? "default" : "outline"}
                  onClick={() => setImportMethod("excel")}
                  className={importMethod === "excel" ? "bg-primary text-primary-foreground" : ""}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Excel/CSV
                </Button>
                <Button
                  type="button"
                  variant={importMethod === "manual" ? "default" : "outline"}
                  onClick={() => setImportMethod("manual")}
                  className={importMethod === "manual" ? "bg-primary text-primary-foreground" : ""}
                >
                  Manual Entry
                </Button>
              </div>

              {/* Excel Upload */}
              {importMethod === "excel" && (
                <Card className="bg-secondary border border-border p-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">Upload CSV or Excel file</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: email, name, role, business_function (optional columns)
                    </p>
                    <input
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="excel-upload"
                    />
                    <Button
                      type="button"
                      asChild
                      variant="outline"
                      className="mt-4 bg-transparent border-border"
                    >
                      <label htmlFor="excel-upload" className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </label>
                    </Button>
                  </div>
                </Card>
              )}

              {/* Manual Entry */}
              {importMethod === "manual" && (
                <Card className="bg-secondary border border-border p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Email *</Label>
                      <Input
                        type="email"
                        value={currentEmail.email}
                        onChange={(e) => setCurrentEmail({ ...currentEmail, email: e.target.value })}
                        placeholder="user@example.com"
                        className="bg-background border-border text-foreground mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <Input
                        type="text"
                        value={currentEmail.name}
                        onChange={(e) => setCurrentEmail({ ...currentEmail, name: e.target.value })}
                        placeholder="John Doe"
                        className="bg-background border-border text-foreground mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Role</Label>
                      <Input
                        type="text"
                        value={currentEmail.role}
                        onChange={(e) => setCurrentEmail({ ...currentEmail, role: e.target.value })}
                        placeholder="Developer"
                        className="bg-background border-border text-foreground mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Business Function (optional)</Label>
                      <Select
                        value={
                          currentEmail.businessFunction 
                            ? currentEmail.businessFunction 
                            : (defaultBusinessFunction ? "__default__" : undefined)
                        }
                        onValueChange={(value) => {
                          // Handle the special "__default__" value
                          if (value === "__default__") {
                            setCurrentEmail({ ...currentEmail, businessFunction: "" })
                          } else {
                            setCurrentEmail({ ...currentEmail, businessFunction: value })
                          }
                        }}
                      >
                        <SelectTrigger className="w-full bg-background border-border text-foreground mt-1">
                          <SelectValue placeholder={defaultBusinessFunction || "Use default or select"} />
                        </SelectTrigger>
                        <SelectContent>
                          {defaultBusinessFunction && (
                            <SelectItem value="__default__">Use default ({defaultBusinessFunction})</SelectItem>
                          )}
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                          <SelectItem value="it">IT Department</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Default: {defaultBusinessFunction || "None set"}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddEmail}
                    disabled={!currentEmail.email.trim()}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Recipient
                  </Button>
                </Card>
              )}

              {/* Email List */}
              {emails.length > 0 && (
                <Card className="bg-secondary border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground">
                      {emails.length} recipient{emails.length !== 1 ? "s" : ""} ready to add
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEmails([])}
                      className="text-destructive hover:text-destructive"
                    >
                      Clear All
                    </Button>
                  </div>
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
                            {item.businessFunction && (
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                                {item.businessFunction}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveEmail(idx)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="border-border bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!organization || emails.length === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Add to Supabase
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

