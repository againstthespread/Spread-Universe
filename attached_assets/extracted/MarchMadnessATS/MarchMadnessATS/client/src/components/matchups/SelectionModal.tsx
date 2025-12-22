import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { GameWithTeams } from "@shared/schema";
import TeamLogo from "@/components/ui/team-logo";
import { useToast } from "@/hooks/use-toast";
import { Clock, X } from "lucide-react";

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameWithTeams;
  onSelectTeam: (teamId: number) => void;
  isSubmitting: boolean;
}

const SelectionModal = ({
  isOpen,
  onClose,
  game,
  onSelectTeam,
  isSubmitting,
}: SelectionModalProps) => {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Check if game is locked (past start time)
  const isGameLocked = new Date(game.startTime) <= new Date();
  
  // If the game becomes locked while the modal is open, close it
  useEffect(() => {
    if (isOpen && isGameLocked) {
      toast({
        title: "Game Locked",
        description: "This game has started and picks are now locked.",
        variant: "destructive",
      });
      onClose();
    }
  }, [isOpen, isGameLocked, onClose, toast]);

  const handleSubmit = () => {
    // Double check that game isn't locked before submitting
    if (isGameLocked) {
      toast({
        title: "Game Locked",
        description: "This game has started and picks are now locked.",
        variant: "destructive",
      });
      onClose();
      return;
    }
    
    if (selectedTeamId !== null) {
      onSelectTeam(selectedTeamId);
    }
  };

  const homeSpread = game.spread;
  const awaySpread = game.spread.startsWith('-') 
    ? `+${game.spread.substring(1)}`
    : `-${game.spread.substring(1)}`;

  // If game is locked, show a different dialog
  if (isGameLocked) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-inter font-bold text-lg text-amber-600">Game Locked</DialogTitle>
            <DialogDescription>
              This game has already started and picks are now locked.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 flex flex-col items-center justify-center">
            <div className="bg-amber-100 text-amber-700 p-4 rounded-lg flex items-center mb-4">
              <Clock className="h-5 w-5 mr-2" />
              <span>Game started at {new Date(game.startTime).toLocaleString()}</span>
            </div>
            <p className="text-gray-600">Picks can only be made before a game starts.</p>
          </div>

          <DialogFooter className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-inter font-bold text-lg">Make Your Pick</DialogTitle>
          <DialogDescription>
            Select which team will cover the spread in this matchup:
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup value={selectedTeamId?.toString()} onValueChange={(value) => setSelectedTeamId(parseInt(value))}>
            {/* Home Team Option */}
            <div className="mb-3">
              <Label
                htmlFor={`team-${game.homeTeamId}`}
                className="flex items-center p-3 bg-gray-50 rounded-lg border-2 border-transparent hover:border-gray-300 cursor-pointer"
              >
                <RadioGroupItem
                  value={game.homeTeamId.toString()}
                  id={`team-${game.homeTeamId}`}
                  className="text-secondary"
                />
                <div className="ml-3 flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <TeamLogo
                      logoUrl={game.homeTeam.logoUrl}
                      teamName={game.homeTeam.name}
                      className="w-8 h-8 mr-2"
                    />
                    <span className="font-inter font-medium">{game.homeTeam.name}</span>
                  </div>
                  <span className="font-medium">{homeSpread}</span>
                </div>
              </Label>
            </div>

            {/* Away Team Option */}
            <div>
              <Label
                htmlFor={`team-${game.awayTeamId}`}
                className="flex items-center p-3 bg-gray-50 rounded-lg border-2 border-transparent hover:border-gray-300 cursor-pointer"
              >
                <RadioGroupItem
                  value={game.awayTeamId.toString()}
                  id={`team-${game.awayTeamId}`}
                  className="text-secondary"
                />
                <div className="ml-3 flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <TeamLogo
                      logoUrl={game.awayTeam.logoUrl}
                      teamName={game.awayTeam.name}
                      className="w-8 h-8 mr-2"
                    />
                    <span className="font-inter font-medium">{game.awayTeam.name}</span>
                  </div>
                  <span className="font-medium">{awaySpread}</span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter className="flex justify-end space-x-3">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={selectedTeamId === null || isSubmitting}
            className="bg-secondary hover:bg-secondary/90 text-white"
          >
            {isSubmitting ? "Submitting..." : "Confirm Pick"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SelectionModal;
