import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const HoneypotConfigForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/honeypots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const result = await response.json();
        console.log('Honeypot deployment started:', result);
        reset();
      } else {
        const errorData = await response.json();
        console.error('Error deploying honeypot:', errorData);
        // Display error to user
      }
    } catch (error) {
      console.error('Error sending request:', error);
      // Handle network error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="region" className="block text-sm font-medium text-gray-700">
          Region
        </label>
        <Select
          onValueChange={(value) => {
            // react-hook-form doesn't natively support shadcn/ui Select, so use setValue
            // @ts-ignore
            register('region').onChange({ target: { value, name: 'region' } });
          }}
        >
          <SelectTrigger id="region" className="w-full">
            <SelectValue placeholder="Select a region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
            <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
            {/* Add more regions */}
          </SelectContent>
        </Select>
        {errors.region && (
          <p className="text-red-500 text-xs mt-1">{errors.region.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="instanceType" className="block text-sm font-medium text-gray-700">
          Instance Type
        </label>
        <Input
          id="instanceType"
          {...register('instanceType', { required: 'Instance type is required' })}
          placeholder="e.g., t3.micro"
          className="w-full"
        />
        {errors.instanceType && (
          <p className="text-red-500 text-xs mt-1">{errors.instanceType.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="cowrieConfig" className="block text-sm font-medium text-gray-700">
          Cowrie Configuration
        </label>
        <Textarea
          id="cowrieConfig"
          {...register('cowrieConfig', { required: 'Cowrie config is required' })}
          placeholder="e.g., { port: 2222, ... }"
          className="w-full"
          rows={4}
        />
        {errors.cowrieConfig && (
          <p className="text-red-500 text-xs mt-1">{errors.cowrieConfig.message as string}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Deploy Honeypot
      </Button>
    </form>
  );
};

export default HoneypotConfigForm;
