import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

{
  /* WelcomeMessage component */
}
export default function WelcomeMessage() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-white p-4 text-center text-gray-500 shadow-md">
      <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
      <h3 className="text-xl font-semibold">Welcome to the create screen!</h3>
      <p>
        Input some changes you would like to make to the site and see what it
        looks like!
      </p>
    </div>
  );
}
