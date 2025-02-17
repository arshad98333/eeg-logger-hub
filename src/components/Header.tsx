
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900">EEG Logger Hub</h1>
      <Link to="/dashboard">
        <Button variant="outline">
          Open Dashboard
        </Button>
      </Link>
    </div>
  );
};
