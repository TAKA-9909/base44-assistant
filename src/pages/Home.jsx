import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Mic, PenLine } from "lucide-react";
import NoteCard from "@/components/notes/NoteCard";
import NoteListToolbar from "@/components/notes/NoteListToolbar";

const PAGE_SIZE = 12;

export default function Home() {
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
    const query = {};
    if (course !== "all") query.course = course;
    const term = search.trim();
    if (term) query.title = { $regex: term, $options: "i" };
    return query;
  }, [course, search]);

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
    <div>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Lecture Notes</p>
          <h1 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">講義ノート</h1>
          <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
            講義を録音すると、文字起こしと要約が自動でノートになります。録音せず、普通のノートとして書くこともできます。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="h-11 rounded-full px-6">
            <Link to="/new">
              <Mic className="mr-2 h-4 w-4" />
              録音する
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-full px-6">
            <Link to="/write">
              <PenLine className="mr-2 h-4 w-4" />
              ノートを書く
            </Link>
          </Button>
        </div>
      </div>

      <NoteListToolbar
        search={search}
        onSearch={setSearch}
        course={course}
        onCourse={setCourse}
        courses={courses}
        total={total}
      />

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-3xl bg-secondary/60" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <p className="font-display text-lg">まだノートがありません</p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
            「録音する」で講義からノートを自動作成、「ノートを書く」で自分の言葉で書けます。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-full px-6">
              <Link to="/new">最初の講義を録音する</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6">
              <Link to="/write">ノートを書く</Link>
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
              <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="rounded-full px-6">
                {loadingMore ? "読み込み中..." : "もっと見る"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}