export default function TemplateClassic({ resume }) {
  const { personal, education, experience, projects, skills } = resume;

  return (
    <div style={{ fontFamily: "Georgia, serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {personal.fullName || "Your Name"}
          </div>
          <div style={{ marginTop: 4 }}>
            {personal.title || "Your Title"}
          </div>
        </div>

        <div style={{ textAlign: "right", fontSize: 12 }}>
          <div>{personal.email || "email@example.com"}</div>
          <div>{personal.phone || "+61 ..."}</div>
          <div>{personal.location || "City, State"}</div>
        </div>
      </div>

      <hr style={{ margin: "12px 0" }} />

      <Section title="Summary">
        <div style={{ lineHeight: 1.5 }}>
          {personal.summary ||
            "Write a short summary that highlights your strengths and target roles."}
        </div>
      </Section>

      <Section title="Education">
        {education.map((ed, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700 }}>
              {ed.degree || "Degree"} — {ed.institution || "Institution"}
            </div>
            <div style={{ fontSize: 12, color: "#444" }}>{ed.year || "Year"}</div>
          </div>
        ))}
      </Section>

      <Section title="Experience">
        {experience.map((ex, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700 }}>
              {(ex.role || "Role")}
              {ex.company ? ` — ${ex.company}` : " — Company"}
            </div>
            <div style={{ fontSize: 12, color: "#444" }}>
              {ex.duration || "Duration"}
            </div>
            <ul style={{ margin: "6px 0 0 18px" }}>
              {(ex.bullets || [])
                .filter((x) => x.trim())
                .map((b, bi) => (
                  <li key={bi} style={{ marginBottom: 4 }}>
                    {b}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </Section>

      <Section title="Projects">
        {projects.map((p, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700 }}>
              {p.name || "Project Name"}
              {p.tech ? <span style={{ fontWeight: 400 }}> • {p.tech}</span> : null}
            </div>
            {p.link ? (
              <div style={{ fontSize: 12, color: "#4f46e5" }}>{p.link}</div>
            ) : null}
            <ul style={{ margin: "6px 0 0 18px" }}>
              {(p.bullets || [])
                .filter((x) => x.trim())
                .map((b, bi) => (
                  <li key={bi} style={{ marginBottom: 4 }}>
                    {b}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </Section>

      <Section title="Skills">
        <div style={{ lineHeight: 1.6 }}>
          <div>
            <strong>Technical:</strong> {skills.technical || "—"}
          </div>
          <div>
            <strong>Tools:</strong> {skills.tools || "—"}
          </div>
          <div>
            <strong>Soft:</strong> {skills.soft || "—"}
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          fontWeight: 800,
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
