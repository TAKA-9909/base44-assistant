import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import NoteCard from "@/components/notes/NoteCard";
import NoteListToolbar from "@/components/notes/NoteListToolbar";
import NotebookCover from "@/components/home/NotebookCover";

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
      <NotebookCover />

      <section className="mt-10">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <h2 className="font-display text-lg tracking-wide">ノートの一覧</h2>
          <span className="h-px flex-1 bg-border" />
        </div>

        <NoteListToolbar
        search={search}
        onSearch={setSearch}
        course={course}
        onCourse={setCourse}
        courses={courses}
        total={total}
      />

      <div className="notebook-ruled-soft rounded-[26px] border border-border bg-card/80 p-4 shadow-sm sm:p-6">
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-2xl bg-secondary/60" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg">まだノートがありません</p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
            「録音する」で講義からノートを自動作成、「ノートを書く」で自分の言葉で書けます。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-md bg-accent px-6 text-accent-foreground hover:bg-accent/90">
              <Link to="/new">最初の講義を録音する</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-md px-6">
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
              <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="rounded-md px-6">
                {loadingMore ? "読み込み中..." : "もっと見る"}
              </Button>
            </div>
          )}
        </>
      )}
      </div>
      </section>
    </div>
  );
}