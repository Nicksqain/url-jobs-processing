'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Stack,
  Badge,
  Textarea,
  Table,
  Icon,
} from '@chakra-ui/react';
import { useJobsControllerCreate, useJobsControllerFindAll } from '@/api/generated/jobs/jobs';
import CreateJobForm from '@/components/CreateJobForm';

export default function HomePage() {
  const [urlsInput, setUrlsInput] = useState('');
  const router = useRouter();

  const { data: jobs, refetch } = useJobsControllerFindAll();
  const { mutate: createJob, isPending } = useJobsControllerCreate({
    mutation: {
      onSuccess: (response) => {
        setUrlsInput('');
        refetch();

        const createdJobId = response?.id; 
        if (createdJobId) {
          router.push(`/jobs/${createdJobId}`);
        }
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = urlsInput
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) return;
    createJob({ data: { urls } });
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'green.50', color: 'green.700', dot: 'green.500', label: 'Завершено' };
      case 'in_progress':
        return { bg: 'blue.50', color: 'blue.700', dot: 'blue.500', label: 'В процессе' };
      case 'failed':
        return { bg: 'red.50', color: 'red.700', dot: 'red.500', label: 'Ошибка' };
      case 'cancelled':
        return { bg: 'gray.100', color: 'gray.700', dot: 'gray.500', label: 'Отменено' };
      default:
        return { bg: 'gray.50', color: 'gray.600', dot: 'gray.400', label: 'Ожидание' };
    }
  };

  return (
    <Box minH="100vh" bg="#f8fafc" py={12} px={4}>
      <Stack gap={8} maxW="5xl" mx="auto">

        {/* Хедер системы */}
        <Flex justify="space-between" align="flex-end" borderBottom="1px solid" borderColor="gray.200" pb={5}>
          <Box>
            <Heading size="xl" fontWeight="800" color="gray.900" letterSpacing="-0.03em">
              URL Monitoring Service
            </Heading>
            <Text color="gray.500" fontSize="md" mt={1} fontWeight="medium">
              Сервис асинхронной проверки списка URL
            </Text>
          </Box>
        </Flex>

        {/* Секция формы ввода */}
        <CreateJobForm />

        {/* Блок Истории */}
        <Box
          bg="white"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
          boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)"
          overflow="hidden"
        >
          <Flex
            px={8}
            py={5}
            borderBottomWidth="1px"
            borderColor="gray.100"
            justify="space-between"
            align="center"
          >
            <Heading size="sm" fontWeight="700" color="gray.800" letterSpacing="-0.01em">
              История запущенных задач
            </Heading>
            <Button
              variant="outline"
              size="xs"
              borderColor="gray.200"
              color="gray.600"
              fontWeight="600"
              _hover={{ bg: 'gray.50', borderColor: 'gray.300' }}
              onClick={() => refetch()}
              px={3}
              py={3.5}
              borderRadius="md"
            >
              Синхронизировать
            </Button>
          </Flex>

          <Box overflowX="auto">
            <Table.Root variant="line" size="sm">
              <Table.Header bg="gray.50/70">
                <Table.Row borderBottomWidth="1px" borderColor="gray.100">
                  <Table.ColumnHeader px={8} py={3.5} color="gray.500" fontWeight="600" fontSize="xs">ID ЗАДАНИЯ</Table.ColumnHeader>
                  <Table.ColumnHeader px={6} py={3.5} color="gray.500" fontWeight="600" fontSize="xs">ИНИЦИИРОВАНО</Table.ColumnHeader>
                  <Table.ColumnHeader px={6} py={3.5} color="gray.500" fontWeight="600" fontSize="xs">СТАТУС</Table.ColumnHeader>
                  <Table.ColumnHeader px={6} py={3.5} color="gray.500" fontWeight="600" fontSize="xs" textAlign="center">ОБЪЕМ</Table.ColumnHeader>
                  <Table.ColumnHeader px={8} py={3.5} color="gray.500" fontWeight="600" fontSize="xs" textAlign="right">РЕЗУЛЬТАТЫ</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {jobs?.map((job) => {
                  const styles = getStatusStyles(job.status);
                  return (
                    <Table.Row key={job.id} _hover={{ bg: 'gray.50/40' }} borderBottomWidth="1px" borderColor="gray.100" transition="background 0.2s">

                      {/* ID */}
                      <Table.Cell px={8} py={4} fontFamily="SFMono-Regular, Consolas, monospace" fontSize="xs" fontWeight="600" color="indigo.600">
                        <Link href={`/jobs/${job.id}`} className="hover:underline" style={{ display: 'inline-block' }}>
                          {job.id}
                        </Link>
                      </Table.Cell>

                      {/* Время создания */}
                      <Table.Cell px={6} py={4} color="gray.600" fontSize="sm" fontWeight="500">
                        {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </Table.Cell>

                      {/* Статус в виде современной точки-индикатора */}
                      <Table.Cell px={6} py={4}>
                        <Flex
                          align="center"
                          display="inline-flex"
                          px={2.5}
                          py={1}
                          borderRadius="full"
                          bg={styles.bg}
                          color={styles.color}
                          fontSize="xs"
                          fontWeight="600"
                        >
                          <Box
                            w="6px"
                            h="6px"
                            borderRadius="full"
                            bg={styles.dot}
                            mr={2}
                            className={job.status === 'in_progress' ? 'animate-pulse' : ''}
                          />
                          {styles.label}
                        </Flex>
                      </Table.Cell>

                      {/* Количество URL */}
                      <Table.Cell px={6} py={4} fontWeight="600" color="gray.700" fontSize="sm" textAlign="center">
                        {job.urlsCount}
                      </Table.Cell>

                      {/* Мягкие счетчики успехов/ошибок */}
                      <Table.Cell px={8} py={4} textAlign="right">
                        <Flex gap={3} justify="flex-end" inlineSize="full">
                          <Flex align="center" px={2} py={0.5} bg="green.50" borderRadius="md">
                            <Text as="span" color="green.700" fontSize="xs" fontWeight="700">✓ {job.stats?.success || 0}</Text>
                          </Flex>
                          <Flex align="center" px={2} py={0.5} bg="red.50" borderRadius="md">
                            <Text as="span" color="red.600" fontSize="xs" fontWeight="700">✗ {job.stats?.error || 0}</Text>
                          </Flex>
                        </Flex>
                      </Table.Cell>

                    </Table.Row>
                  );
                })}

                {!jobs?.length && (
                  <Table.Row>
                    <Table.Cell colSpan={5} py={12} textAlign="center" color="gray.400" fontSize="sm" fontWeight="500">
                      Пулл задач пуст. Создайте первую проверку выше.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}