import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Search } from "lucide-react";

export default function NoteListToolbar({ search, onSearch, course, onCourse, courses, total }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="タイトルで検索"
            className="h-11 rounded-md pl-9"
          />
        </div>
        <Select value={course} onValueChange={onCourse}>
          <SelectTrigger className="h-11 rounded-md sm:w-48">
            <SelectValue placeholder="科目で絞り込む" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての科目</SelectItem>
            {courses.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="font-display text-sm text-muted-foreground sm:whitespace-nowrap">{total} 件のノート</p>
    </div>
  );
}