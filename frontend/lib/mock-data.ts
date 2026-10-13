// =============================================================================
// LectureLoop — demonstration data (frontend-only prototype).
// Everything here is locally generated, deterministic sample content. None of it
// was produced by an LLM or pulled from an actual YouTube video, even though the
// source fields include placeholder URLs/timestamps for realism.
// =============================================================================

import type {
  Flashcard,
  Lecture,
  LearningStats,
  NotificationItem,
  QuizQuestion,
  Recommendation,
  StudyActivityDay,
  Subject,
  SubjectProgress,
  UpcomingRevision,
  UserSettings,
} from "@/types";
import { isoDate } from "./utils";

export const DEMO_SUBJECTS: Subject[] = [
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "Data Structures",
];

export const defaultSettings: UserSettings = {
  name: "Rishitha",
  email: "rishitha@lectureloop.app",
  dailyGoalMinutes: 45,
  reminderEnabled: true,
  reminderTime: "18:30",
  preferredDifficulty: "medium",
  confirmQuizSubmit: true,
};

// --------------------------------------------------------------------------- DBMS

const dbmsTopics = [
  {
    id: "dbms-keys",
    title: "Keys & constraints",
    order: 1,
    timestampSeconds: 180,
    summary:
      "Keys are attribute sets used to identify rows uniquely and to link tables together. A primary key is a minimal set of attributes that uniquely identifies every row; a foreign key references a primary key in another table to enforce referential integrity.",
    keyPoints: [
      "A primary key must be unique and NOT NULL for every row.",
      "A composite key uses two or more columns to identify a row.",
      "A foreign key points to a referenced table's primary key and guarantees data consistency.",
      "Candidate keys are all minimal keys; the chosen one becomes the primary key.",
      "Unique constraints allow NULLs but still prevent duplicate values.",
    ],
    definitions: [
      {
        term: "Primary key",
        definition:
          "A minimal set of attributes that uniquely identifies each record in the table.",
      },
      {
        term: "Foreign key",
        definition: "An attribute that references the primary key of another table.",
      },
      {
        term: "Candidate key",
        definition: "A minimal superkey — a unique key with no removable attributes.",
      },
    ],
    examples: [
      "In a Student table, `roll_no` is a natural primary key.",
      "In an Enrolment table, `(student_id, course_code)` is a composite key.",
      "`student_id` inside Enrolment is a foreign key referencing Student.",
    ],
    examImportant: [
      "Difference between primary key and unique key.",
      "A foreign key value can be NULL — it references \"no row\".",
      "Referential integrity is enforced by the DBMS on foreign key columns.",
    ],
    sourceExcerpt:
      "…each row is identified by its primary key, and when one table stores the primary key of another, that column is called a foreign key…",
    sourceTimestampSeconds: 240,
  },
  {
    id: "dbms-fd",
    title: "Functional dependencies",
    order: 2,
    timestampSeconds: 780,
    summary:
      "A functional dependency X → Y means the value of X uniquely determines the value of Y. Functional dependencies are the formal foundation used to reason about redundancy and to guide normalization.",
    keyPoints: [
      "X → Y holds when every two rows with equal X also have equal Y.",
      "Trivial dependency: Y is a subset of X (X → X is trivial).",
      "Armstrong's axioms let us derive new dependencies (reflexivity, augmentation, transitivity).",
      "A superkey functionally determines every attribute of the relation.",
      "Partial and transitive dependencies are the causes of redundancy that normalization removes.",
    ],
    definitions: [
      {
        term: "Functional dependency",
        definition: "X → Y: the values of Y are fully determined by the values of X.",
      },
      {
        term: "Full dependency",
        definition:
          "Y is fully functionally dependent on X when X → Y and X is minimal (no proper subset of X determines Y).",
      },
      {
        term: "Transitive dependency",
        definition:
          "X → Y and Y → Z with Y not a superkey — a hidden chain that 3NF removes.",
      },
    ],
    examples: [
      "roll_no → name holds because each roll number maps to exactly one name.",
      "In a poorly designed table, course_code → instructor creates transitive redundancy.",
      "If (roll_no, course_code) → grade, grade is fully dependent on the composite key.",
    ],
    examImportant: [
      "Deciding whether a dependency is partial, full, or transitive.",
      "Finding candidate keys from a given dependency set.",
      "Armstrong's axioms — reflexivity, augmentation, transitivity.",
    ],
    sourceExcerpt:
      "…we say that X determines Y. If every time the X values match, the Y values must match too, then X → Y is a functional dependency…",
    sourceTimestampSeconds: 820,
  },
  {
    id: "dbms-normalization",
    title: "Normalization & normal forms",
    order: 3,
    timestampSeconds: 1320,
    summary:
      "Normalization removes redundancy and update anomalies by restructuring tables. First normal form requires atomic values; second removes partial dependencies; third removes transitive dependencies; BCNF tightens third normal form.",
    keyPoints: [
      "1NF — every attribute holds a single, atomic value; no repeating groups.",
      "2NF — 1NF plus no partial dependency on any part of a composite key.",
      "3NF — 2NF plus no transitive dependency on a non-key attribute.",
      "BCNF — for every dependency X → Y, X must be a superkey.",
      "Normalization reduces insert/update/delete anomalies but adds joins.",
    ],
    definitions: [
      {
        term: "Anomaly",
        definition: "An inconsistency or error introduced by redundant storage (insert, update, delete).",
      },
      {
        term: "Normal form",
        definition: "A structural rule a table satisfies; stronger forms build on weaker ones.",
      },
      {
        term: "Decomposition",
        definition: "Splitting a relation into smaller relations while preserving dependencies.",
      },
    ],
    examples: [
      "Storing a list of phone numbers in one cell violates 1NF; split it into rows.",
      "A table (student_id, course_code, course_name) has a partial dependency, so split into Student and Course.",
      "Employee → Department → DepartmentHead is transitive; move DepartmentHead out to fix 3NF.",
    ],
    examImportant: [
      "Identify which normal form a given table satisfies.",
      "1NF vs 2NF vs 3NF vs BCNF differences.",
      "Preservation of functional dependencies during decomposition.",
    ],
    sourceExcerpt:
      "…to reach third normal form we remove the transitive dependencies, so that every non-key attribute depends only on the key, the whole key, and nothing but the key…",
    sourceTimestampSeconds: 1420,
  },
  {
    id: "dbms-sql",
    title: "SQL essentials",
    order: 4,
    timestampSeconds: 2240,
    summary:
      "SQL is the standard language for defining and querying relational databases. DDL builds the schema, DML manipulates data, and SELECT with JOIN combines information across tables.",
    keyPoints: [
      "DDL: CREATE, ALTER, DROP — defines the schema.",
      "DML: INSERT, UPDATE, DELETE — changes data.",
      "DQL: SELECT with WHERE, GROUP BY, ORDER BY and JOIN.",
      "INNER JOIN returns only matching rows; LEFT JOIN keeps all rows from the left table.",
      "Aggregates (COUNT, SUM, AVG) collapse groups of rows into one value.",
    ],
    definitions: [
      {
        term: "Join",
        definition: "Combining rows from two tables based on a matching column.",
      },
      {
        term: "Aggregate function",
        definition: "A function that summarizes many rows into one (COUNT, SUM, AVG, MIN, MAX).",
      },
      {
        term: "Subquery",
        definition: "A SELECT statement nested inside another query.",
      },
    ],
    examples: [
      "SELECT name FROM Student WHERE roll_no = 101;",
      "SELECT c.code FROM Course c JOIN Enrolment e ON c.code = e.course_code;",
      "SELECT subject, AVG(marks) FROM Exam GROUP BY subject;",
    ],
    examImportant: [
      "Semantics of INNER vs LEFT JOIN.",
      "WHERE filters rows; HAVING filters groups after GROUP BY.",
      "Order of SQL clauses: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY.",
    ],
    sourceExcerpt:
      "…SQL splits into a definition part and a manipulation part. When you join two tables you are matching rows on a shared column, which is exactly what the foreign key describes…",
    sourceTimestampSeconds: 2320,
  },
];

export const dbmsLecture: Lecture = {
  id: "lec-dbms",
  title: "Database Normalization & Keys Explained",
  subject: "DBMS",
  instructor: "Prof. Meera Krishnan",
  date: isoDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
  durationSeconds: 2880,
  progress: 65,
  status: "ready",
  description:
    "A complete walk through keys, functional dependencies, normalization (1NF–BCNF) and the SQL commands that implement them.",
  source: {
    type: "youtube",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    channel: "Theoretical CS Series",
    capturedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  materials: { notes: true, flashcards: 8, quizQuestions: 10 },
  topics: dbmsTopics,
  notes: {
    lectureId: "lec-dbms",
    title: "Database Normalization & Keys",
    overview:
      "Relational design starts with keys and constraints, is analysed with functional dependencies, and is restructured through normalization to remove redundancy. SQL then implements the resulting schema.",
    takeaways: [
      "Primary and foreign keys are the backbone of relational integrity.",
      "Functional dependencies expose where redundancy hides.",
      "Normalization removes anomalies; BCNF is the strictest common form.",
      "Joins in SQL materialize the relationships that foreign keys describe.",
    ],
    topics: dbmsTopics,
    references: [
      { excerpt: "…each row is identified by its primary key…", timestampSeconds: 240 },
      { excerpt: "…X determines Y…functional dependency…", timestampSeconds: 820 },
      { excerpt: "…third normal form removes transitive dependencies…", timestampSeconds: 1420 },
      { excerpt: "…when you join two tables you match rows on a shared column…", timestampSeconds: 2320 },
    ],
  },
  demo: true,
};

// --------------------------------------------------------------------------- OS

const osTopics = [
  {
    id: "os-scheduling",
    title: "Process scheduling",
    order: 1,
    timestampSeconds: 140,
    summary:
      "The scheduler decides which ready process runs on the CPU. FCFS, SJF, Round Robin and Priority are classic algorithms with different fairness and turnaround trade-offs.",
    keyPoints: [
      "FCFS is simple but suffers from the convoy effect.",
      "SJF minimizes average waiting time but needs CPU times in advance.",
      "Round Robin gives each process a fixed time quantum.",
      "Preemptive scheduling can interrupt a running process.",
    ],
    definitions: [
      { term: "Turnaround time", definition: "Total time from submission to completion." },
      { term: "Waiting time", definition: "Time spent in the ready queue, not running." },
      { term: "Time quantum", definition: "The maximum CPU burst a process gets in Round Robin." },
    ],
    examples: [
      "Round Robin with quantum 2ms rotates through three processes fairly.",
      "SJF schedules the shortest job first, minimizing average wait.",
    ],
    examImportant: ["Convoy effect in FCFS.", "Round Robin fairness with equal quantum."],
    sourceExcerpt: "…round robin prevents starvation by giving every process a slice of the CPU…",
    sourceTimestampSeconds: 200,
  },
  {
    id: "os-memory",
    title: "Memory management & paging",
    order: 2,
    timestampSeconds: 900,
    summary:
      "Paging divides memory into fixed-size frames and pages, letting a process's pages live in non-contiguous frames. Page tables translate virtual addresses to physical ones.",
    keyPoints: [
      "Pages are fixed-size units of virtual memory; frames are the physical counterparts.",
      "The page table maps virtual page → physical frame.",
      "TLB caches recent translations to speed up lookup.",
      "Page faults trigger a disk transfer of the missing page.",
    ],
    definitions: [
      { term: "Page fault", definition: "Access to a page not present in RAM." },
      { term: "TLB", definition: "A cache for page-table translations." },
      { term: "Virtual memory", definition: "The abstraction that lets processes see a large logical address space." },
    ],
    examples: ["A 4KB page table reaches a 32-bit address space in ~1M entries."],
    examImportant: ["Page table + TLB walk.", "Why paging eliminates external fragmentation."],
    sourceExcerpt: "…paging removes external fragmentation because physical frames can be anywhere…",
    sourceTimestampSeconds: 980,
  },
  {
    id: "os-threads",
    title: "Threads & concurrency",
    order: 3,
    timestampSeconds: 1500,
    summary:
      "Threads are lightweight units of execution within a process, sharing its address space. Concurrency introduces races, which locks and monitors mitigate.",
    keyPoints: [
      "Threads share process memory but have their own stack and registers.",
      "Context switching between threads is cheaper than between processes.",
      "A race condition occurs when outcomes depend on thread interleaving.",
      "Mutexes and semaphores serialise access to shared resources.",
    ],
    definitions: [
      { term: "Race condition", definition: "Unexpected outcome caused by concurrent access to shared state." },
      { term: "Deadlock", definition: "Two or more threads each waiting on resources held by the other." },
    ],
    examples: ["Two threads incrementing a shared counter without a lock can lose updates."],
    examImportant: ["Classic race example: unsynchronized counter.", "Difference between process and thread."],
    sourceExcerpt: "…without a lock, two threads reading then writing the same counter can lose an update…",
    sourceTimestampSeconds: 1580,
  },
];

export const osLecture: Lecture = {
  id: "lec-os",
  title: "Operating Systems: Scheduling to Virtual Memory",
  subject: "Operating Systems",
  instructor: "Dr. Arjun Menon",
  date: isoDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
  durationSeconds: 2340,
  progress: 42,
  status: "ready",
  description:
    "CPU scheduling algorithms, paging-based memory management, and the basics of threads and synchronisation.",
  source: {
    type: "youtube",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    channel: "Theoretical CS Series",
    capturedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  materials: { notes: true, flashcards: 2, quizQuestions: 2 },
  topics: osTopics,
  notes: {
    lectureId: "lec-os",
    title: "Operating Systems Core Concepts",
    overview:
      "The OS virtualizes the CPU with scheduling, the memory with paging, and the concurrency model with threads and locks.",
    takeaways: [
      "Scheduling trades fairness against average turnaround.",
      "Paging eliminates external fragmentation.",
      "Locks prevent races but must be used to avoid deadlock.",
    ],
    topics: osTopics,
    references: [
      { excerpt: "…round robin prevents starvation…", timestampSeconds: 200 },
      { excerpt: "…paging removes external fragmentation…", timestampSeconds: 980 },
    ],
  },
  demo: true,
};

// --------------------------------------------------------------------------- CN

const cnTopics = [
  {
    id: "cn-models",
    title: "OSI & TCP/IP models",
    order: 1,
    timestampSeconds: 160,
    summary:
      "Network reference models organise networking into layers. The OSI model has seven layers; the TCP/IP model collapses them into four.",
    keyPoints: [
      "OSI layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.",
      "TCP/IP layers: Link, Internet, Transport, Application.",
      "Each layer serves the layer above it and uses the layer below.",
      "Encapsulation adds headers as data moves down the stack.",
    ],
    definitions: [
      { term: "Protocol", definition: "A set of rules governing data exchange between layers or hosts." },
      { term: "Encapsulation", definition: "Wrapping data with protocol headers at each layer." },
    ],
    examples: ["HTTP uses TCP over IP over Ethernet in practice."],
    examImportant: ["Order the OSI layers.", "Where TCP and IP sit in each model."],
    sourceExcerpt: "…when data travels down the stack each layer adds its own header, which the receiver strips off again…",
    sourceTimestampSeconds: 240,
  },
  {
    id: "cn-transport",
    title: "TCP vs UDP",
    order: 2,
    timestampSeconds: 720,
    summary:
      "TCP is a reliable, connection-oriented transport protocol; UDP is a lightweight, connectionless one. The choice depends on the application's needs.",
    keyPoints: [
      "TCP: connection setup, sequencing, acknowledgements, retransmission, flow control.",
      "UDP: no connection, no retransmission → lower latency, no ordering guarantee.",
      "TCP slow start probes available bandwidth.",
      "UDP suits streaming and gaming where freshness beats reliability.",
    ],
    definitions: [
      { term: "Three-way handshake", definition: "SYN, SYN-ACK, ACK — TCP connection establishment." },
      { term: "Checksum", definition: "Error detection over header and payload in both UDP and TCP." },
    ],
    examples: ["DNS requests use UDP; file downloads and web pages use TCP."],
    examImportant: ["Handshake steps.", "Why streaming often uses UDP."],
    sourceExcerpt: "…TCP guarantees delivery by acknowledging each segment, while UDP simply fires datagrams toward the socket…",
    sourceTimestampSeconds: 800,
  },
];

export const cnLecture: Lecture = {
  id: "lec-cn",
  title: "Computer Networks: Models and Transport",
  subject: "Computer Networks",
  instructor: "Anitha Rao",
  date: isoDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
  durationSeconds: 1800,
  progress: 28,
  status: "ready",
  description:
    "The seven-layer OSI model, the four-layer TCP/IP model, and a practical comparison of TCP and UDP.",
  source: {
    type: "youtube",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    channel: "Theoretical CS Series",
    capturedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  materials: { notes: true, flashcards: 2, quizQuestions: 2 },
  topics: cnTopics,
  notes: {
    lectureId: "lec-cn",
    title: "Network Models & Transport Protocols",
    overview:
      "Layered models structure networking; the transport layer then delivers data either reliably (TCP) or quickly (UDP).",
    takeaways: [
      "Encapsulation is how layers communicate.",
      "TCP trades latency for reliability.",
    ],
    topics: cnTopics,
    references: [{ excerpt: "…TCP guarantees delivery…UDP simply fires datagrams…", timestampSeconds: 800 }],
  },
  demo: true,
};

// --------------------------------------------------------------------------- DS

const dsTopics = [
  {
    id: "ds-bigo",
    title: "Big-O complexity",
    order: 1,
    timestampSeconds: 120,
    summary:
      "Big-O notation describes how an algorithm's runtime or memory grows with input size, ignoring constants. It is the standard vocabulary for comparing algorithms.",
    keyPoints: [
      "O(1), O(log n), O(n), O(n log n), O(n²) — in increasing growth.",
      "Drop constants and lower-order terms.",
      "Worst-case analysis is the default unless stated otherwise.",
    ],
    definitions: [
      { term: "Big-O", definition: "Upper bound on growth as input size → ∞." },
      { term: "Amortized analysis", definition: "Average cost per operation across a sequence (e.g. dynamic arrays)." },
    ],
    examples: ["Binary search is O(log n); nested loops are commonly O(n²)."],
    examImportant: ["Ranking functions by growth rate.", "Identifying loop complexity."],
    sourceExcerpt: "…we ignore constants and keep only the fastest-growing term…",
    sourceTimestampSeconds: 180,
  },
  {
    id: "ds-trees",
    title: "Trees & traversals",
    order: 2,
    timestampSeconds: 640,
    summary:
      "Trees are hierarchical structures. Binary search trees keep data sorted for O(log n) operations, and in-order/pre-order/post-order traversals visit nodes systematically.",
    keyPoints: [
      "A BST satisfies left < node < right for every node.",
      "In-order traversal of a BST yields sorted order.",
      "Height-balanced trees avoid worst-case chains.",
    ],
    definitions: [
      { term: "BST", definition: "Binary search tree with ordered children." },
      { term: "Traversal", definition: "Visiting nodes in a defined order (in, pre, post, level)." },
    ],
    examples: ["In-order: left → root → right, producing sorted output."],
    examImportant: ["Trace a traversal on a small tree.", "BST worst case when inserted sorted."],
    sourceExcerpt: "…an in-order traversal of a binary search tree prints all the values in sorted order…",
    sourceTimestampSeconds: 700,
  },
];

export const dsLecture: Lecture = {
  id: "lec-ds",
  title: "Data Structures: Complexity and Trees",
  subject: "Data Structures",
  instructor: "Prof. Mohammed Iqbal",
  date: isoDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
  durationSeconds: 1680,
  progress: 18,
  status: "ready",
  description:
    "Algorithmic complexity, binary search trees and the classic depth-first traversal orders.",
  source: {
    type: "youtube",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    channel: "Theoretical CS Series",
    capturedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  materials: { notes: true, flashcards: 2, quizQuestions: 0 },
  topics: dsTopics,
  notes: {
    lectureId: "lec-ds",
    title: "Complexity & Trees",
    overview:
      "Big-O gives algorithms a shared vocabulary; trees give data a shape that supports fast search and ordered traversal.",
    takeaways: ["Complexity ignores constants.", "BST order keeps search logarithmic."],
    topics: dsTopics,
    references: [{ excerpt: "…we ignore constants and keep only the fastest-growing term…", timestampSeconds: 180 }],
  },
  demo: true,
};

export const sampleLectures: Lecture[] = [dbmsLecture, osLecture, cnLecture, dsLecture];

// --------------------------------------------------------------------------- Flashcards

export const sampleFlashcards: Flashcard[] = [
  {
    id: "card-1",
    lectureId: "lec-dbms",
    topicId: "dbms-keys",
    question: "What is a primary key?",
    answer:
      "A minimal set of attributes that uniquely identifies each row in a table. It must be unique and NOT NULL for every row.",
    difficulty: "easy",
    sourceTimestampSeconds: 210,
    sourceExcerpt: "…each row is identified by its primary key…",
  },
  {
    id: "card-2",
    lectureId: "lec-dbms",
    topicId: "dbms-keys",
    question: "Can a foreign key column contain NULL values?",
    answer:
      "Yes. A NULL foreign key simply means the row is not linked to any row in the referenced table. Non-NULL values must match an existing primary key.",
    difficulty: "medium",
    sourceTimestampSeconds: 300,
    sourceExcerpt: "…a foreign key value can be NULL — it references 'no row'…",
  },
  {
    id: "card-3",
    lectureId: "lec-dbms",
    topicId: "dbms-keys",
    question: "Difference between primary key and candidate key?",
    answer:
      "A candidate key is any minimal superkey. The database designer selects one of the candidate keys to become the primary key; the others remain alternate keys.",
    difficulty: "medium",
    sourceTimestampSeconds: 380,
    sourceExcerpt: "…candidate keys are all the minimal keys; the chosen one becomes the primary key…",
  },
  {
    id: "card-4",
    lectureId: "lec-dbms",
    topicId: "dbms-fd",
    question: "What does the functional dependency X → Y mean?",
    answer:
      "Whenever two rows have the same value for X, they must also have the same value for Y. In other words, X determines Y.",
    difficulty: "easy",
    sourceTimestampSeconds: 810,
    sourceExcerpt: "…if every time the X values match, the Y values must match too, then X → Y…",
  },
  {
    id: "card-5",
    lectureId: "lec-dbms",
    topicId: "dbms-fd",
    question: "What is a trivial functional dependency?",
    answer: "A dependency X → Y where Y is a subset of X. Example: (roll_no, name) → roll_no.",
    difficulty: "hard",
    sourceTimestampSeconds: 870,
    sourceExcerpt: "…trivial dependency: Y is a subset of X…",
  },
  {
    id: "card-6",
    lectureId: "lec-dbms",
    topicId: "dbms-normalization",
    question: "When is a table in 1NF?",
    answer:
      "When every attribute holds a single, atomic value and there are no repeating groups — e.g. no lists or comma-separated values inside a cell.",
    difficulty: "easy",
    sourceTimestampSeconds: 1360,
    sourceExcerpt: "…first normal form requires atomic column values…",
  },
  {
    id: "card-7",
    lectureId: "lec-dbms",
    topicId: "dbms-normalization",
    question: "What anomaly does 2NF fix?",
    answer:
      "2NF removes partial dependencies — a non-key attribute depending on only part of a composite key. This eliminates duplicate/inconsistent data for that attribute.",
    difficulty: "medium",
    sourceTimestampSeconds: 1490,
    sourceExcerpt: "…second normal form removes partial dependencies on a composite key…",
  },
  {
    id: "card-8",
    lectureId: "lec-dbms",
    topicId: "dbms-normalization",
    question: "State the requirement for a relation to be in BCNF.",
    answer:
      "For every non-trivial functional dependency X → Y, X must be a superkey of the relation. BCNF is stricter than 3NF.",
    difficulty: "hard",
    sourceTimestampSeconds: 1650,
    sourceExcerpt: "…for every dependency X → Y, X must be a superkey…",
  },
  {
    id: "card-9",
    lectureId: "lec-os",
    topicId: "os-scheduling",
    question: "Name one drawback of FCFS scheduling.",
    answer:
      "The convoy effect: short jobs wait behind a long-running job, increasing average waiting and turnaround time.",
    difficulty: "medium",
    sourceTimestampSeconds: 260,
    sourceExcerpt: "…FCFS is simple but suffers from the convoy effect…",
  },
  {
    id: "card-10",
    lectureId: "lec-os",
    topicId: "os-memory",
    question: "What does a page table map?",
    answer: "Virtual page numbers to physical frame numbers, enabling non-contiguous physical allocation.",
    difficulty: "easy",
    sourceTimestampSeconds: 950,
    sourceExcerpt: "…the page table maps virtual page → physical frame…",
  },
  {
    id: "card-11",
    lectureId: "lec-cn",
    topicId: "cn-transport",
    question: "Why does streaming video often use UDP instead of TCP?",
    answer:
      "UDP has lower latency and no retransmission delays; a lost frame is preferable to the entire stream pausing while TCP recovers segments.",
    difficulty: "medium",
    sourceTimestampSeconds: 860,
    sourceExcerpt: "…UDP suits streaming and gaming where freshness beats reliability…",
  },
  {
    id: "card-12",
    lectureId: "lec-cn",
    topicId: "cn-models",
    question: "How many layers does the OSI model have?",
    answer: "Seven: Physical, Data Link, Network, Transport, Session, Presentation, Application.",
    difficulty: "easy",
    sourceTimestampSeconds: 200,
    sourceExcerpt: "…OSI layers: Physical, Data Link, Network, Transport, Session, Presentation, Application…",
  },
  {
    id: "card-13",
    lectureId: "lec-ds",
    topicId: "ds-bigo",
    question: "What is the Big-O of binary search?",
    answer: "O(log n) — each comparison halves the remaining search space.",
    difficulty: "easy",
    sourceTimestampSeconds: 240,
    sourceExcerpt: "…binary search is O(log n)…",
  },
  {
    id: "card-14",
    lectureId: "lec-ds",
    topicId: "ds-trees",
    question: "Which traversal of a BST yields sorted order?",
    answer: "In-order traversal (left subtree → root → right subtree).",
    difficulty: "easy",
    sourceTimestampSeconds: 760,
    sourceExcerpt: "…an in-order traversal of a BST prints values in sorted order…",
  },
];

// --------------------------------------------------------------------------- Quiz bank

export const sampleQuizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    lectureId: "lec-dbms",
    topicId: "dbms-keys",
    topicTitle: "Keys & constraints",
    question: "Which property must always hold for a primary key?",
    options: [
      "It may contain duplicate values",
      "It must be unique and NOT NULL for every row",
      "It must reference another table",
      "It can be NULL for a valid row",
    ],
    correctIndex: 1,
    explanation:
      "A primary key uniquely identifies every row — duplicates are forbidden and NULLs are not allowed.",
    difficulty: "easy",
  },
  {
    id: "q2",
    lectureId: "lec-dbms",
    topicId: "dbms-keys",
    topicTitle: "Keys & constraints",
    question: "In the Enrolment table, student_id references the Student table. What is student_id in Enrolment?",
    options: [
      "A primary key",
      "A candidate key",
      "A foreign key",
      "A superkey",
    ],
    correctIndex: 2,
    explanation:
      "A column in one table that references the primary key of another table is a foreign key.",
    difficulty: "easy",
  },
  {
    id: "q3",
    lectureId: "lec-dbms",
    topicId: "dbms-fd",
    topicTitle: "Functional dependencies",
    question: "Given roll_no → name, which statement is true?",
    options: [
      "Knowing the name determines the roll number",
      "Knowing the roll number determines the name",
      "name → roll_no also always holds",
      "No functional dependency is guaranteed",
    ],
    correctIndex: 1,
    explanation:
      "X → Y means the attributes on the left determine the attributes on the right, so roll_no determines name.",
    difficulty: "medium",
  },
  {
    id: "q4",
    lectureId: "lec-dbms",
    topicId: "dbms-fd",
    topicTitle: "Functional dependencies",
    question: "Which is a trivial functional dependency?",
    options: [
      "A → B where A and B are disjoint",
      "roll_no → course_code",
      "(roll_no, name) → roll_no",
      "X → Y where X is a superkey",
    ],
    correctIndex: 2,
    explanation:
      "A dependency is trivial when the right side is a subset of the left side. (roll_no, name) → roll_no is trivial.",
    difficulty: "hard",
  },
  {
    id: "q5",
    lectureId: "lec-dbms",
    topicId: "dbms-normalization",
    topicTitle: "Normalization & normal forms",
    question: "A table stores a student's phone numbers as a comma-separated list in one cell. Which normal form does it violate?",
    options: ["3NF", "BCNF", "2NF", "1NF"],
    correctIndex: 3,
    explanation:
      "1NF requires atomic values and no repeating groups, so a comma-separated list breaks 1NF.",
    difficulty: "easy",
  },
  {
    id: "q6",
    lectureId: "lec-dbms",
    topicId: "dbms-normalization",
    topicTitle: "Normalization & normal forms",
    question: "Which normal form removes transitive dependencies on non-key attributes?",
    options: ["1NF", "2NF", "3NF", "None of the above"],
    correctIndex: 2,
    explanation:
      "3NF removes transitive dependencies where a non-key attribute depends on another non-key attribute.",
    difficulty: "medium",
  },
  {
    id: "q7",
    lectureId: "lec-dbms",
    topicId: "dbms-normalization",
    topicTitle: "Normalization & normal forms",
    question: "In BCNF, every non-trivial dependency X → Y must have X as:",
    options: ["A candidate key", "Any attribute", "A foreign key", "A primary key including NULLs"],
    correctIndex: 0,
    explanation:
      "BCNF requires every determinant to be a superkey; X must be a candidate key for non-trivial dependencies.",
    difficulty: "hard",
  },
  {
    id: "q8",
    lectureId: "lec-dbms",
    topicId: "dbms-sql",
    topicTitle: "SQL essentials",
    question: "Which SQL clause filters rows BEFORE grouping?",
    options: ["HAVING", "WHERE", "ORDER BY", "SELECT"],
    correctIndex: 1,
    explanation:
      "WHERE filters individual rows; HAVING filters groups after GROUP BY runs.",
    difficulty: "medium",
  },
  {
    id: "q9",
    lectureId: "lec-dbms",
    topicId: "dbms-sql",
    topicTitle: "SQL essentials",
    question: "SELECT c.code FROM Course c JOIN Enrolment e ON c.code = e.course_code returns:",
    options: [
      "All course codes, even unenrolled ones",
      "Only courses that have at least one enrolment",
      "All enrolment rows regardless of courses",
      "A syntax error",
    ],
    correctIndex: 1,
    explanation:
      "INNER JOIN keeps only rows where the join condition matches, i.e. courses with at least one enrolment.",
    difficulty: "medium",
  },
  {
    id: "q10",
    lectureId: "lec-dbms",
    topicId: "dbms-sql",
    topicTitle: "SQL essentials",
    question: "Which statement about transactions is correct?",
    options: [
      "ACID stands for Atomicity, Consistency, Isolation, Durability",
      "ACID stands for Access, Create, Insert, Delete",
      "Transactions make changes visible immediately to everyone",
      "Transactions do not support rollback",
    ],
    correctIndex: 0,
    explanation:
      "ACID summarises the guarantees of database transactions; rollback is fundamental to atomicity.",
    difficulty: "medium",
  },
  {
    id: "q11",
    lectureId: "lec-os",
    topicId: "os-scheduling",
    topicTitle: "Process scheduling",
    question: "Which scheduling algorithm minimises average waiting time (theoretically)?",
    options: ["FCFS", "SJF", "Round Robin", "Random"],
    correctIndex: 1,
    explanation:
      "Shortest-Job-First maximises throughput and minimises average waiting time, though it needs CPU times in advance.",
    difficulty: "medium",
  },
  {
    id: "q12",
    lectureId: "lec-os",
    topicId: "os-memory",
    topicTitle: "Memory management & paging",
    question: "What is a TLB?",
    options: [
      "The table that lists all processes",
      "A cache for recent page-table translations",
      "The physical memory allocator",
      "A scheduling queue",
    ],
    correctIndex: 1,
    explanation: "The TLB (translation lookaside buffer) caches virtual-to-physical translations to speed up address translation.",
    difficulty: "easy",
  },
  {
    id: "q13",
    lectureId: "lec-cn",
    topicId: "cn-models",
    topicTitle: "OSI & TCP/IP models",
    question: "In the OSI model, which layer is directly above the Network layer?",
    options: ["Physical", "Data Link", "Transport", "Session"],
    correctIndex: 2,
    explanation:
      "Counting from the bottom: Physical, Data Link, Network, Transport, Session, Presentation, Application. So Transport sits directly above Network.",
    difficulty: "easy",
  },
  {
    id: "q14",
    lectureId: "lec-cn",
    topicId: "cn-transport",
    topicTitle: "TCP vs UDP",
    question: "Which of these is a UDP feature?",
    options: [
      "Guaranteed delivery with retransmission",
      "Connection setup via three-way handshake",
      "No ordering or delivery guarantees",
      "Flow control windows",
    ],
    correctIndex: 2,
    explanation: "UDP is connectionless and makes no guarantees about ordering or delivery — that is exactly why it is fast.",
    difficulty: "medium",
  },
];

// --------------------------------------------------------------------------- Analytics / dashboard

/** Seven-day sample study activity ending today. */
export const sampleStudyActivity: StudyActivityDay[] = Array.from({ length: 7 }, (_, i) => {
  const offset = 6 - i;
  const date = new Date();
  date.setDate(date.getDate() - offset);
  const minutes = [35, 60, 20, 75, 45, 90, 30][i] + (i === 6 ? 15 : 0);
  return {
    date: isoDate(date),
    label: date.toLocaleDateString(undefined, { weekday: "short" }),
    minutes,
  };
});

export const sampleSubjectProgress: SubjectProgress[] = [
  { subject: "DBMS", progress: 65, flashcardCount: 8, weak: false },
  { subject: "Operating Systems", progress: 42, flashcardCount: 2, weak: true },
  { subject: "Computer Networks", progress: 28, flashcardCount: 2, weak: true },
  { subject: "Data Structures", progress: 18, flashcardCount: 2, weak: false },
];

/** Sample weekly quiz score trend (dates relative to today). */
export const sampleQuizTrend = [62, 70, 55, 78, 84, 72, 86].map((score, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  return {
    date: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score,
  };
});

export const sampleStats: LearningStats = {
  totalLectures: 4,
  totalFlashcards: 42,
  flashcardsReviewed: 118,
  avgQuizScore: 78,
  quizzesCompleted: 6,
  streakDays: 6,
  minutesStudied: 355,
};

/** A small sample RT of weekly study time, mostly for the analytics copy. */
export const sampleStudyMinutes = 355;

export const sampleRecommendations: Recommendation[] = [
  {
    id: "rec-1",
    kind: "weak-topic",
    title: "Revise “Normalization & normal forms”",
    description:
      "Last quiz accuracy on this topic was 50%. The 2NF/3NF/BCNF distinction needs one more pass.",
    href: "/notes?lecture=lec-dbms&topic=dbms-normalization",
    cta: "Open notes",
  },
  {
    id: "rec-2",
    kind: "due-flashcards",
    title: "5 flashcards are due today",
    description: "Keys, functional dependencies and normalization cards are ready to review.",
    href: "/flashcards",
    cta: "Start review",
  },
  {
    id: "rec-3",
    kind: "quiz",
    title: "Retake the DBMS practice quiz",
    description: "A 10-question refresher keeps weak topics from slipping.",
    href: "/quiz",
    cta: "Take quiz",
  },
];

export const upcomingRevisions: UpcomingRevision[] = [
  { id: "rev-1", title: "Normalization & normal forms", dueIn: "Today", count: 3, href: "/flashcards?lecture=lec-dbms&topic=dbms-normalization" },
  { id: "rev-2", title: "Keys & constraints", dueIn: "Tomorrow", count: 2, href: "/flashcards?lecture=lec-dbms&topic=dbms-keys" },
  { id: "rev-3", title: "Process scheduling", dueIn: "In 2 days", count: 1, href: "/flashcards?lecture=lec-os&topic=os-scheduling" },
  { id: "rev-4", title: "TCP vs UDP", dueIn: "In 3 days", count: 1, href: "/flashcards?lecture=lec-cn&topic=cn-transport" },
];

export const sampleNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Flashcards due",
    description: "5 cards across DBMS are ready to review.",
    time: "12 min ago",
    read: false,
    href: "/flashcards",
  },
  {
    id: "notif-2",
    title: "Quiz result",
    description: "You scored 90% on the SQL essentials quiz.",
    time: "2 h ago",
    read: false,
    href: "/quiz",
  },
  {
    id: "notif-3",
    title: "Study streak",
    description: "6-day streak — keep it going today.",
    time: "Yesterday",
    read: true,
    href: "/",
  },
];

// --------------------------------------------------------------------------- Helpers

export function getSubjectProgress(): SubjectProgress[] {
  return sampleSubjectProgress;
}

export function getNotifications(): NotificationItem[] {
  return sampleNotifications;
}

/** Sample DBMS transcript used by the Add Lecture “sample transcript” button. */
export const SAMPLE_TRANSCRIPT = `In this lecture we look at how relational databases are designed. We start with keys. A primary key is a minimal set of attributes that uniquely identifies every row in a table. When one table stores the primary key of another table, that column is called a foreign key, and it enforces referential integrity.

Next we talk about functional dependencies. If every time the values of X match, the values of Y also match, then X determines Y, and we write X → Y. Functional dependencies help us find redundant data.

That leads us to normalization. First normal form requires that every attribute holds a single atomic value. Second normal form removes partial dependencies on part of a composite key. Third normal form removes transitive dependencies between non-key attributes. Boyce-Codd normal form goes further and requires that every non-trivial dependency starts from a superkey.

Finally we connect the design to SQL. We create tables with CREATE, we insert rows with INSERT, and we query with SELECT. When we join two tables we match rows on a shared column — typically the foreign key — using INNER JOIN, LEFT JOIN and friends. Aggregates like COUNT and AVG summarize groups of rows.`;

export const SAMPLE_TRANSCRIPT_MIN_WORDS = 40;