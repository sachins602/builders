export default function Footer() {
  return (
    <footer className="flex h-8 w-full items-center justify-end p-2 text-black">
      <div className="text-[10px]">
        &copy; {new Date().getFullYear()} BT @ Conestoga College. All rights
        reserved.
      </div>
    </footer>
  );
}
