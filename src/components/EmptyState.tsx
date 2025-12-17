import { motion } from 'framer-motion';
import { ShoppingCart, PartyPopper } from 'lucide-react';

interface EmptyStateProps {
  type: 'empty' | 'complete';
  onReset?: () => void;
}

export function EmptyState({ type, onReset }: EmptyStateProps) {
  if (type === 'complete') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 px-8 text-center"
      >
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <PartyPopper className="w-16 h-16 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Handlingen klar!
        </h2>
        <p className="text-muted-foreground mb-6">
          Alla varor är avbockade. Bra jobbat!
        </p>
        {onReset && (
          <button
            onClick={onReset}
            className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg
                       hover:bg-primary/90 transition-colors touch-target"
          >
            Börja om med demo-lista
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
        <ShoppingCart className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">
        Ingen inköpslista
      </h2>
      <p className="text-muted-foreground mb-6 max-w-xs">
        Exportera en lista från din veckoplaneringsapp för att börja handla.
      </p>
      {onReset && (
        <button
          onClick={onReset}
          className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg
                     hover:bg-primary/90 transition-colors touch-target"
        >
          Ladda demo-lista
        </button>
      )}
    </motion.div>
  );
}
