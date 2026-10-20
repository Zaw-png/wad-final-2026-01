
import { useEffect, useState } from "react";
import { HashRouter } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import "./App.css";

function CourseApp() {
  const { user, login, register, logout, api } = useUser();

  const [courses, setCourses] = useState([]);
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "student",
  });

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    capacity: 30,
  });

  const [editingId, setEditingId] = useState(null);

  async function loadCourses() {
    try {
      const data = await api("/api/course");
      setCourses(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function handleAuth(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "register") {
        await register(
          authForm.username,
          authForm.email,
          authForm.password,
          authForm.role
        );
        await login(authForm.email, authForm.password);
        setMessage("Registration successful!");
      } else {
        await login(authForm.email, authForm.password);
        setMessage("Login successful!");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCourse(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api(
        editingId ? `/api/course/${editingId}` : "/api/course",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(courseForm),
        }
      );

      setMessage(editingId ? "Course updated!" : "Course created!");
      setCourseForm({ title: "", description: "", capacity: 30 });
      setEditingId(null);
      await loadCourses();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCourse(id) {
    if (!window.confirm("Delete this course?")) return;

    try {
      await api(`/api/course/${id}`, { method: "DELETE" });
      setMessage("Course deleted!");
      await loadCourses();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function enroll(id, action) {
    try {
      await api(`/api/course/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      setMessage(action === "enroll" ? "Enrolled successfully!" : "Withdrawn!");
      await loadCourses();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editCourse(course) {
    setEditingId(course.id);
    setCourseForm({
      title: course.title,
      description: course.description,
      capacity: course.capacity,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Online Course Service</h1>
          <p>Learn, teach, and grow together</p>
        </div>

        {user && (
          <div className="user-info">
            <span>{user.username} ({user.role})</span>
            <button
              className="secondary"
              onClick={async () => {
                try {
                  await logout();
                  setMessage("Logged out");
                } catch (error) {
                  setMessage(error.message);
                }
              }}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="container">
        {message && <div className="notice">{message}</div>}

        {!user && (
          <section className="panel auth-panel">
            <h2>{mode === "login" ? "Login" : "Create Account"}</h2>

            <form onSubmit={handleAuth}>
              {mode === "register" && (
                <input
                  placeholder="Username"
                  required
                  value={authForm.username}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, username: e.target.value })
                  }
                />
              )}

              <input
                type="email"
                placeholder="Email"
                required
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm({ ...authForm, email: e.target.value })
                }
              />

              <input
                type="password"
                placeholder="Password"
                required
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({ ...authForm, password: e.target.value })
                }
              />

              {mode === "register" && (
                <select
                  value={authForm.role}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, role: e.target.value })
                  }
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              )}

              <button disabled={loading} type="submit">
                {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
              </button>
            </form>

            <button
              className="link-button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setMessage("");
              }}
            >
              {mode === "login"
                ? "Don't have an account? Register"
                : "Already have an account? Login"}
            </button>
          </section>
        )}

        {user?.role === "teacher" && (
          <section className="panel">
            <h2>{editingId ? "Edit Course" : "Create Course"}</h2>

            <form onSubmit={handleCourse}>
              <input
                placeholder="Course title"
                required
                value={courseForm.title}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, title: e.target.value })
                }
              />

              <textarea
                placeholder="Course description"
                required
                value={courseForm.description}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, description: e.target.value })
                }
              />

              <label>Maximum students</label>
              <input
                type="number"
                min="1"
                required
                value={courseForm.capacity}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, capacity: Number(e.target.value) })
                }
              />

              <button disabled={loading} type="submit">
                {editingId ? "Save Changes" : "Create Course"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setEditingId(null);
                    setCourseForm({ title: "", description: "", capacity: 30 });
                  }}
                >
                  Cancel Editing
                </button>
              )}
            </form>
          </section>
        )}

        <section className="courses-section">
          <div className="section-heading">
            <h2>Available Courses</h2>
            <button className="secondary" onClick={loadCourses}>
              Refresh
            </button>
          </div>

          <div className="course-grid">
            {courses.length === 0 && (
              <p>No courses available yet.</p>
            )}

            {courses.map((course) => {
              const enrolled = (course.enrolledStudents || []).includes(user?.id);
              const count = (course.enrolledStudents || []).length;
              const isOwner = user?.role === "teacher" &&
                course.teacherId === user.id;

              return (
                <article className="course-card" key={course.id}>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <p><strong>Teacher:</strong> {course.teacherName}</p>
                  <p><strong>Enrollment:</strong> {count} / {course.capacity}</p>

                  <div className="actions">
                    {isOwner && (
                      <>
                        <button onClick={() => editCourse(course)}>
                          Edit
                        </button>
                        <button
                          className="danger"
                          onClick={() => deleteCourse(course.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {user?.role === "student" && (
                      <button
                        disabled={!enrolled && count >= course.capacity}
                        onClick={() => enroll(course.id, enrolled ? "withdraw" : "enroll")}
                      >
                        {enrolled
                          ? "Withdraw"
                          : count >= course.capacity
                            ? "Course Full"
                            : "Enroll"}
                      </button>
                    )}

                    {!user && <span>Login to enroll</span>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <UserProvider>
        <CourseApp />
      </UserProvider>
    </HashRouter>
  );
}

