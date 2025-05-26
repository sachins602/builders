export default function Footer() {
  return (
    <footer className="flex h-16 w-full items-center justify-center text-white">
      <div className="text-sm">
        &copy; {new Date().getFullYear()} My Application. All rights reserved.
      </div>
    </footer>
  );
}
