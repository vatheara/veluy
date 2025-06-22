import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Button } from '@repo/ui/components/button';
import { KhqrDialog, useKhqr } from '../../dist/index';
// import { KhqrDialog, useKhqr } from '../index';

const meta = {
  component: KhqrDialog,
  decorators: [
    (Story) => {
      const { setIsOpen, setTitle, setDescription } = useKhqr();
      return (
        <div className="flex flex-col p-4 gap-4">
          <Button onClick={() => {
            setIsOpen(true);
            setTitle("Hello");
            setDescription("This is a test");
          }}>Open Dialog</Button>
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof KhqrDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};