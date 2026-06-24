'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Field,
  Textarea,
  Text,
  Stack,
  Flex,
} from '@chakra-ui/react';
import { useJobsStore } from '../store/useJobsStore';
import { useJobsControllerCreate } from '../api/generated/jobs/jobs';

const URL_REGEX = /^https?:\/\/[^\s$.?#].[^\s]*$/i;

export default function CreateJobForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rawInput, setRawInput] = useState('');
  
  const { setError } = useJobsStore();
  const { mutateAsync: createJobApi } = useJobsControllerCreate();

  const urlLines = rawInput
    .split(/[\n, ]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const invalidUrls = urlLines.filter((url) => !URL_REGEX.test(url));
  const hasInvalid = invalidUrls.length > 0;
  const isEmpty = urlLines.length === 0;

  const handleSubmit = async () => {
    if (isEmpty || hasInvalid) return;

    startTransition(async () => {
      try {
        const uniqueUrls = Array.from(new Set(urlLines));
        
        const response = await createJobApi({
          data: { urls: uniqueUrls }
        });

        if (response?.id) {
          router.push(`/jobs/${response.id}`);
        }
      } catch (err: any) {
        setError(err.message || 'Не удалось запустить пакетную обработку');
      }
    });
  };

  return (
    <Box
      bg="white"
      p={8}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.05)"
    >
      <Stack gap={5}>
        <Box>
          <Text fontSize="sm" fontWeight="700" color="gray.800" mb={1}>
            Ввод URL для пакетной проверки
          </Text>
          <Text fontSize="xs" color="gray.400" fontWeight="500">
            Вставляйте ссылки по одной в строку (через Enter) или разделяйте пробелами.
          </Text>
        </Box>

        <Box position="relative">
          <Textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="https://example.com&#10;https://google.com"
            minH="160px"
            size="sm"
            borderRadius="lg"
            borderColor={hasInvalid ? 'red.400' : 'gray.200'}
            _focus={{
              borderColor: hasInvalid ? 'red.500' : 'blue.500',
              boxShadow: hasInvalid ? '0 0 0 1px var(--chakra-colors-red-500)' : '0 0 0 1px var(--chakra-colors-blue-500)',
            }}
            fontFamily="SFMono-Regular, Consolas, monospace"
            fontSize="xs"
            p={4}
            disabled={isPending}
          />
        </Box>

        <Flex justify="space-between" align="center" minH="20px">
          <Box>
            {hasInvalid ? (
              <Text fontSize="11px" color="red.500" fontWeight="600">
                Обнаружено невалидных URL: {invalidUrls.length} (проверьте наличие http:// или https://)
              </Text>
            ) : !isEmpty ? (
              <Text fontSize="11px" color="green.600" fontWeight="600">
                Готово к отправке: {urlLines.length} строк(и)
              </Text>
            ) : null}
          </Box>

          <Button
            colorPalette={hasInvalid ? 'gray' : 'blue'}
            variant="solid"
            size="sm"
            fontWeight="600"
            borderRadius="lg"
            px={6}
            onClick={handleSubmit}
            disabled={isEmpty || hasInvalid || isPending}
          >
            {isPending ? 'Запуск...' : 'Запустить проверку'}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}