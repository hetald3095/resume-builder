export default function TemplateModern({ resume }) {
  const { personal, education, experience, projects, skills } = resume;

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div
        style={{
          background: "#111827",
          color: "white",
          padding: 14,
          borderRadius: 12,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800 }}>
          {personal.fullName || "Your Name"}
        </div>
        <div style={{ opacity: 0.9, marginTop: 4 }}>
          {personal.title || "Your Title"}
        </div>
        <div style={{ fontSize: 12, opacity: 0.9, marginTop: 8 }}>
          {personal.email || "email@example.com"} • {personal.phone || "+61 ..."} •{" "}
          {personal.location || "City, State"}
        </div>
      </div>

      <div style={{ padding: "12px 4px" }}>
        <Block title="Summary">
          <div style={{ lineHeight: 1.5 }}>
            {personal.summary ||
              "Write a short summary that highlights your strengths and target roles."}
          </div>
        </Block>

        <TwoCol
          left={
            <Block title="Education">
              {education.map((ed, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700 }}>
                    {ed.degree || "Degree"}
                  </div>
                  <div style={{ fontSize: 12, color: "#374151" }}>
                    {ed.institution || "Institution"} • {ed.year || "Year"}
                  </div>
                </div>
              ))}
            </Block>
          }
          right={
            <Block title="Skills">
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                <div><strong>Technical:</strong> {skills.technical || "—"}</div>
                <div><strong>Tools:</strong> {skills.tools || "—"}</div>
                <div><strong>Soft:</strong> {skills.soft || "—"}</div>
              </div>
            </Block>
          }
        />

        <Block title="Experience">
          {experience.map((ex, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 800 }}>
                {(ex.role || "Role")}
                {ex.company ? ` — ${ex.company}` : " — Company"}
              </div>
              <div style={{ fontSize: 12, color: "#374151" }}>
                {ex.duration || "Duration"}
              </div>
              <ul style={{ margin: "6px 0 0 18px" }}>
                {(ex.bullets || [])
                  .filter((x) => x.trim())
                  .map((b, bi) => (
                    <li key={bi} style={{ marginBottom: 4, fontSize: 13 }}>
                      {b}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </Block>

        <Block title="Projects">
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 800 }}>
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
                    <li key={bi} style={{ marginBottom: 4, fontSize: 13 }}>
                      {b}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </Block>
      </div>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          fontWeight: 900,
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 0.7,
          marginBottom: 6,
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function TwoCol({ left, right }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 }}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}
