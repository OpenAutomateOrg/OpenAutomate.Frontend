"use client"

import { MoreHorizontal, Trash, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import React from "react"
import type { AssetRow } from './asset'

interface DataTableRowActionProps {
  readonly asset: AssetRow;
  readonly onEdit?: (asset: AssetRow) => void;
}

export default function DataTableRowAction({ asset, onEdit }: DataTableRowActionProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          aria-label="Open menu"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[160px]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <DropdownMenuItem onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          if (onEdit) onEdit(asset);
        }}>
          <Pencil className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span>Edit</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <Trash className="mr-2 h-4 w-4 text-destructive" aria-hidden="true" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
