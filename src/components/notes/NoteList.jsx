import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import NoteCard from "@/components/notes/NoteCard";
import NoteListToolbar from "@/components/notes/NoteListToolbar";
import PageNav from "@/components/nav/PageNav";

const PAGE_SIZE = 12;

export default function NoteList({
  title,
  baseQuery,
  emptyTitle,
  emptyDescription,
  actionLabel,
  actionTo
}) {
  const [notes, setNotes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("all");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const buildQuery = useCallback(() => {
    const query = { ...baseQuery };
    if (course !== "all") query.course = course;
    const term = search.trim();
    if (term) query.title = { $regex: term, $options: "i" };
    return query;
  }, [baseQuery, course, search]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      const query = buildQuery();
      const [page, count] = await Promise.all([
        base44.entities.LectureNote.filter(query, { sort: "-lecture_date", limit: PAGE_SIZE }),
        base44.entities.LectureNote.count(query)
      ]);
      if (!active) return;
      setNotes(page.items || []);
      setCursor(page.next_cursor || null);
      setHasMore(Boolean(page.has_more));
      setTotal(count || 0);
      setLoading(false);
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [buildQuery]);

  useEffect(() => {
    base44.entities.LectureNote.list({ distinct: "course" }).then((page) => {
      setCourses((page.items || []).filter(Boolean));
    });
  }, []);

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const page = await base44.entities.LectureNote.filter(buildQuery(), {
      sort: "-lecture_date",
      limit: PAGE_SIZE,
      cursor
    });
    setNotes((previous) => [...previous, ...(page.items || [])]);
    setCursor(page.next_cursor || null);
    setHasMore(Boolean(page.has_more));
    setLoadingMore(false);
  };

  return (
    <div className="-mx-5 -mb-10 -mt-10 min-h-[calc(100vh-4rem)] bg-background sm:-mb-14 sm:-mt-14">
      <div className="mx-auto max-w-5xl px-5 pb-16 pt-8">
        <PageNav />

        <div className="notebook-ruled-soft rounded-md border border-border bg-card p-4 shadow-xl sm:p-6">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h1 className="font-display text-lg tracking-wide text-notebook-paper-foreground">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground">{total} 件</p>
          </div>

          <NoteListToolbar
            search={search}
            onSearch={setSearch}
            course={course}
            onCourse={setCourse}
            courses={courses}
          />
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-40 animate-pulse rounded-2xl bg-secondary/60" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-secondary/30 px-6 py-16 text-center">
              <p className="font-display text-lg">{emptyTitle}</p>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
                {emptyDescription}
              </p>
              <div className="mt-6 flex justify-center">
                <Button asChild className="rounded-md bg-accent px-6 text-accent-foreground hover:bg-accent/90">
                  <Link to={actionTo}>{actionLabel}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                {notes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="rounded-md px-6">
                    {loadingMore ? "読み込み中..." : "もっと見る"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}