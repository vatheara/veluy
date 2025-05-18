import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { usePendingDialogStore } from '@/stores/use-pending-dialog-store';

import { PendingDialog } from './index';

const meta = {
  component: PendingDialog,
  decorators: [
    (Story) => {
      const { setIsOpen, setTitle, setDescription } = usePendingDialogStore();
      return (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Shadcn UI Example</h1>
          <button onClick={() => {
            setIsOpen(true);
            setTitle("Hello");
            setDescription("This is a test");
          }}>Open Dialog</button>
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof PendingDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};