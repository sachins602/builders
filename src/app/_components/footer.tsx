export default function Footer() {
  return (
    <footer className="h-8 w-full text-black flex justify-end items-center p-2">
      <div className="text-[10px]">
        &copy; {new Date().getFullYear()} BT @ Conestoga College. All rights reserved.
      </div>
    </footer>
  );
}
