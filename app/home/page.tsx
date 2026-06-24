export default function LegacyHomePage() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "window.location.replace('/integrations' + window.location.search);",
        }}
      />
      <p>Redirecting to integrations…</p>
    </>
  );
}
