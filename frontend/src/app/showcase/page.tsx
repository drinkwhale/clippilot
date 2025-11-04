/**
 * UI 컴포넌트 쇼케이스 페이지
 * 모든 컴포넌트의 데모 및 사용 예시
 */

'use client';

import React from 'react';
import {
  Button,
  Card,
  Input,
  Badge,
  Avatar,
  AvatarGroup,
  Checkbox,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  Spinner,
  DotsSpinner,
  PulseSpinner,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
  Select,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  ToastProvider,
  useToast,
  Progress,
  CircularProgress,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
} from '@/components/ui';

function ShowcaseContent() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [checkboxChecked, setCheckboxChecked] = React.useState(false);
  const [switchChecked, setSwitchChecked] = React.useState(false);
  const [progress, setProgress] = React.useState(45);
  const [selectValue, setSelectValue] = React.useState('');
  const { addToast } = useToast();

  return (
    <div className="min-h-screen bg-background-primary p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-title1 font-bold text-foreground-primary mb-2">
            Linear Theme Component Showcase
          </h1>
          <p className="text-regular text-foreground-secondary">
            Linear.app 테마 기반으로 제작된 재사용 가능한 UI 컴포넌트 라이브러리
          </p>
        </div>

        <Tabs defaultValue="buttons">
          <TabsList variant="underline">
            <TabsTrigger value="buttons" variant="underline">
              Buttons
            </TabsTrigger>
            <TabsTrigger value="forms" variant="underline">
              Forms
            </TabsTrigger>
            <TabsTrigger value="data" variant="underline">
              Data Display
            </TabsTrigger>
            <TabsTrigger value="overlays" variant="underline">
              Overlays
            </TabsTrigger>
            <TabsTrigger value="feedback" variant="underline">
              Feedback
            </TabsTrigger>
          </TabsList>

          {/* Buttons Tab */}
          <TabsContent value="buttons">
            <div className="grid gap-8">
              {/* Button Variants */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Button Variants
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="danger">Danger Button</Button>
                  <Button variant="outline">Outline Button</Button>
                </div>
              </Card>

              {/* Button Sizes */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Button Sizes
                </h2>
                <div className="flex items-center flex-wrap gap-3">
                  <Button size="xs">Extra Small</Button>
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button size="xl">Extra Large</Button>
                </div>
              </Card>

              {/* Button States */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Button States
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Button>Normal</Button>
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <Button fullWidth>Full Width</Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Forms Tab */}
          <TabsContent value="forms">
            <div className="grid gap-8">
              {/* Input */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Input Fields
                </h2>
                <div className="space-y-4 max-w-md">
                  <Input label="Default Input" placeholder="Enter text..." />
                  <Input
                    label="With Icon"
                    placeholder="Search..."
                    leftIcon={
                      <svg width="16" height="16" fill="none">
                        <path
                          d="M7 13A6 6 0 1 0 7 1a6 6 0 0 0 0 12ZM13 13l-2-2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    }
                  />
                  <Input
                    label="With Error"
                    placeholder="Enter email..."
                    error="Invalid email address"
                  />
                  <Input label="Disabled" disabled value="Disabled input" />
                </div>
              </Card>

              {/* Checkbox & Switch */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Checkbox & Switch
                </h2>
                <div className="space-y-4">
                  <Checkbox
                    label="Accept terms and conditions"
                    description="You must agree to continue"
                    checked={checkboxChecked}
                    onChange={(e) => setCheckboxChecked(e.target.checked)}
                  />
                  <Switch
                    label="Enable notifications"
                    description="Receive updates via email"
                    checked={switchChecked}
                    onChange={(e) => setSwitchChecked(e.target.checked)}
                  />
                </div>
              </Card>

              {/* Select & Dropdown */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Select & Dropdown
                </h2>
                <div className="space-y-4 max-w-md">
                  <Select
                    label="Select Option"
                    placeholder="Choose an option"
                    options={[
                      { value: '1', label: 'Option 1' },
                      { value: '2', label: 'Option 2' },
                      { value: '3', label: 'Option 3' },
                    ]}
                    value={selectValue}
                    onChange={setSelectValue}
                  />

                  <div>
                    <label className="block mb-2 text-regular font-medium">
                      Custom Dropdown
                    </label>
                    <Dropdown>
                      <DropdownTrigger>Open Menu</DropdownTrigger>
                      <DropdownContent>
                        <DropdownLabel>Actions</DropdownLabel>
                        <DropdownItem value="edit">Edit</DropdownItem>
                        <DropdownItem value="duplicate">Duplicate</DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem value="delete" destructive>
                          Delete
                        </DropdownItem>
                      </DropdownContent>
                    </Dropdown>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Data Display Tab */}
          <TabsContent value="data">
            <div className="grid gap-8">
              {/* Card */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Cards
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card variant="default">
                    <h3 className="font-semibold mb-2">Default Card</h3>
                    <p className="text-small text-foreground-tertiary">
                      This is a default card variant
                    </p>
                  </Card>
                  <Card variant="elevated">
                    <h3 className="font-semibold mb-2">Elevated Card</h3>
                    <p className="text-small text-foreground-tertiary">
                      This card has a shadow
                    </p>
                  </Card>
                  <Card variant="outlined">
                    <h3 className="font-semibold mb-2">Outlined Card</h3>
                    <p className="text-small text-foreground-tertiary">
                      This card has a border
                    </p>
                  </Card>
                </div>
              </Card>

              {/* Badge */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Badges
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Badge>Default</Badge>
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge dot>With Dot</Badge>
                  <Badge removable onRemove={() => console.log('removed')}>
                    Removable
                  </Badge>
                </div>
              </Card>

              {/* Avatar */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Avatars
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar size="xs" name="John Doe" />
                    <Avatar size="sm" name="Jane Smith" />
                    <Avatar size="md" name="Bob Wilson" />
                    <Avatar size="lg" name="Alice Brown" />
                    <Avatar size="xl" name="Charlie Davis" />
                  </div>

                  <div className="flex items-center gap-3">
                    <Avatar name="User 1" status="online" showStatus />
                    <Avatar name="User 2" status="away" showStatus />
                    <Avatar name="User 3" status="busy" showStatus />
                    <Avatar name="User 4" status="offline" showStatus />
                  </div>

                  <AvatarGroup max={3}>
                    <Avatar name="User 1" />
                    <Avatar name="User 2" />
                    <Avatar name="User 3" />
                    <Avatar name="User 4" />
                    <Avatar name="User 5" />
                  </AvatarGroup>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Overlays Tab */}
          <TabsContent value="overlays">
            <div className="grid gap-8">
              {/* Modal */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Modal
                </h2>
                <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                  <ModalHeader>
                    <ModalTitle>Modal Title</ModalTitle>
                    <ModalDescription>
                      This is a modal dialog with header, body, and footer sections.
                    </ModalDescription>
                  </ModalHeader>
                  <ModalBody>
                    <p className="text-regular text-foreground-secondary">
                      Modal body content goes here. You can add forms, text, or any
                      other content.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
                  </ModalFooter>
                </Modal>
              </Card>

              {/* Tooltip */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Tooltip
                </h2>
                <div className="flex gap-4">
                  <Tooltip content="Top tooltip" side="top">
                    <Button>Hover (Top)</Button>
                  </Tooltip>
                  <Tooltip content="Right tooltip" side="right">
                    <Button>Hover (Right)</Button>
                  </Tooltip>
                  <Tooltip content="Bottom tooltip" side="bottom">
                    <Button>Hover (Bottom)</Button>
                  </Tooltip>
                  <Tooltip content="Left tooltip" side="left">
                    <Button>Hover (Left)</Button>
                  </Tooltip>
                </div>
              </Card>

              {/* Popover */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Popover
                </h2>
                <Popover>
                  <PopoverTrigger>
                    <Button>Open Popover</Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="space-y-2">
                      <h3 className="font-semibold">Popover Title</h3>
                      <p className="text-small text-foreground-tertiary">
                        This is popover content with more detailed information.
                      </p>
                      <Button size="sm" fullWidth>
                        Action
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </Card>
            </div>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <div className="grid gap-8">
              {/* Toast */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Toast Notifications
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() =>
                      addToast({
                        title: 'Success!',
                        description: 'Operation completed successfully',
                        variant: 'success',
                      })
                    }
                  >
                    Success Toast
                  </Button>
                  <Button
                    onClick={() =>
                      addToast({
                        title: 'Error!',
                        description: 'Something went wrong',
                        variant: 'error',
                      })
                    }
                  >
                    Error Toast
                  </Button>
                  <Button
                    onClick={() =>
                      addToast({
                        title: 'Warning!',
                        description: 'Please be careful',
                        variant: 'warning',
                      })
                    }
                  >
                    Warning Toast
                  </Button>
                  <Button
                    onClick={() =>
                      addToast({
                        title: 'Info',
                        description: 'Here is some information',
                        variant: 'info',
                      })
                    }
                  >
                    Info Toast
                  </Button>
                </div>
              </Card>

              {/* Spinners */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Loading Spinners
                </h2>
                <div className="flex items-center gap-8">
                  <div className="space-y-2">
                    <Spinner size="sm" label="Small" />
                  </div>
                  <div className="space-y-2">
                    <DotsSpinner size="md" />
                  </div>
                  <div className="space-y-2">
                    <PulseSpinner size="lg" variant="brand" />
                  </div>
                </div>
              </Card>

              {/* Progress */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Progress Indicators
                </h2>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-4">
                      <span className="text-small">Progress: {progress}%</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setProgress(Math.max(0, progress - 10))}
                        >
                          -10
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setProgress(Math.min(100, progress + 10))}
                        >
                          +10
                        </Button>
                      </div>
                    </div>
                    <Progress value={progress} showLabel />
                  </div>

                  <div className="flex items-center gap-6">
                    <CircularProgress value={progress} showLabel />
                    <CircularProgress
                      value={progress}
                      variant="success"
                      showLabel
                    />
                    <CircularProgress value={progress} variant="warning" />
                  </div>
                </div>
              </Card>

              {/* Skeleton */}
              <Card>
                <h2 className="text-title3 font-semibold text-foreground-primary mb-4">
                  Skeleton Loaders
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-small font-medium mb-3">Text Skeleton</h3>
                    <SkeletonText lines={3} />
                  </div>

                  <div>
                    <h3 className="text-small font-medium mb-3">Card Skeleton</h3>
                    <SkeletonCard hasImage hasAvatar lines={2} />
                  </div>

                  <div>
                    <h3 className="text-small font-medium mb-3">Table Skeleton</h3>
                    <SkeletonTable rows={3} columns={4} />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ShowcasePage() {
  return (
    <ToastProvider position="bottom-right">
      <ShowcaseContent />
    </ToastProvider>
  );
}
