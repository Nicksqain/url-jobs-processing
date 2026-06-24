'use client';

import { useParams, useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Stack,
  Spinner,
} from '@chakra-ui/react';
import { useJobsControllerFindOne, useJobsControllerRemove } from '../../../api/generated/jobs/jobs';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const parentRef = useRef<HTMLDivElement>(null);

  const { data: job, refetch } = useJobsControllerFindOne(id, {
    query: {
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === 'in_progress' || status === 'pending' ? 1000 : false;
      },
    },
  });

  const { mutate: cancelJob } = useJobsControllerRemove({
    mutation: {
      onSuccess: () => refetch(),
    },
  });

  const rowVirtualizer = useVirtualizer({
    count: job?.urls?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  if (!job) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg="#f8fafc" direction="column" gap={4}>
        <Spinner size="lg" color="indigo.500" width="36px" height="36px" />
        <Text color="gray.500" fontSize="sm" fontWeight="medium">Сборка метрик и логов задачи...</Text>
      </Flex>
    );
  }

  // Хелпер для форматирования ISO даты в локальное время (HH:MM:SS)
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('ru-RU', { hour12: false });
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'green.50', color: 'green.700', dot: 'green.500', label: 'Завершено' };
      case 'in_progress':
        return { bg: 'blue.50', color: 'blue.700', dot: 'blue.500', label: 'В процессе' };
      case 'failed':
        return { bg: 'red.50', color: 'red.700', dot: 'red.500', label: 'Провал' };
      case 'cancelled':
        return { bg: 'gray.100', color: 'gray.700', dot: 'gray.500', label: 'Отменено' };
      default:
        return { bg: 'gray.50', color: 'gray.600', dot: 'gray.400', label: 'Ожидание' };
    }
  };

  const getUrlBadgeStyles = (status: string) => {
    switch (status) {
      case 'success': return { bg: 'green.50/80', color: 'green.700', label: 'Success' };
      case 'error': return { bg: 'red.50/80', color: 'red.700', label: 'Error' };
      case 'in_progress': return { bg: 'blue.50/80', color: 'blue.700', label: 'Active' };
      case 'cancelled': return { bg: 'gray.100', color: 'gray.600', label: 'Cancelled' };
      default: return { bg: 'gray.50', color: 'gray.400', label: 'Pending' };
    }
  };

  const mainStatus = getStatusStyles(job.status);

  return (
    <Box minH="100vh" bg="#f8fafc" py={12} px={4}>
      <Stack gap={6} maxW="5xl" mx="auto">

        <Flex justify="space-between" align="center">
          <Button
            variant="plain"
            size="sm"
            borderRadius="lg"
            px={4}
            onClick={() => router.push('/jobs')}
          >
            ← Панель управления
          </Button>

          {(job?.status === 'in_progress' || job?.status === 'pending') && (
            <Button
              colorPalette="red"
              variant="solid"
              size="sm"
              fontWeight="600"
              borderRadius="lg"
              onClick={() => cancelJob({ id })}
            >
              Прервать обработку
            </Button>
          )}
        </Flex>

        {/* Карточка дашборда с общей статистикой */}
        <Box
          bg="white"
          p={8}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
          boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.05)"
        >
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={6}>
            <Stack gap={2}>
              <Text fontFamily="SFMono-Regular, Consolas, monospace" fontSize="xs" fontWeight="600" color="gray.400">
                UUID: {job?.id}
              </Text>
              <Flex align="center" gap={3}>
                <Heading size="md" fontWeight="800" color="gray.800" letterSpacing="-0.02em">
                  Текушее состояние:
                </Heading>
                <Flex
                  align="center"
                  px={3}
                  py={1}
                  borderRadius="full"
                  bg={mainStatus.bg}
                  color={mainStatus.color}
                  fontSize="xs"
                  fontWeight="700"
                >
                  <Box
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    bg={mainStatus.dot}
                    mr={2}
                    className={job?.status === 'in_progress' ? 'animate-pulse' : ''}
                  />
                  {mainStatus.label.toUpperCase()}
                </Flex>
              </Flex>
            </Stack>

            <Flex gap={8} px={6} py={4} bg="gray.50/80" borderRadius="xl" borderWidth="1px" borderColor="gray.100">
              <Box minW="70px">
                <Text color="gray.500" fontSize="xs" fontWeight="600">ОБЪЕМ</Text>
                <Text fontSize="xl" fontWeight="700" color="gray.800" mt={0.5}>{job?.urlsCount}</Text>
              </Box>
              <Box minW="70px" borderLeft="1px solid" borderColor="gray.200" pl={6}>
                <Text color="green.600" fontSize="xs" fontWeight="600">УСПЕШНО</Text>
                <Text fontSize="xl" fontWeight="700" color="green.600" mt={0.5}>{job?.stats?.success || 0}</Text>
              </Box>
              <Box minW="70px" borderLeft="1px solid" borderColor="gray.200" pl={6}>
                <Text color="red.500" fontSize="xs" fontWeight="600">ОШИБКИ</Text>
                <Text fontSize="xl" fontWeight="700" color="red.500" mt={0.5}>{job?.stats?.error || 0}</Text>
              </Box>
            </Flex>
          </Flex>
        </Box>

        <Box
          bg="white"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
          boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.05)"
          overflow="hidden"
        >
          <Box px={8} py={5} bg="gray.50/50" borderBottomWidth="1px" borderColor="gray.100">
            <Heading size="sm" fontWeight="700" color="gray.800" letterSpacing="-0.01em">
              Ссылки задания ({job?.urlsCount || 0})
            </Heading>
          </Box>

          <Box
            ref={parentRef}
            maxH="500px"
            overflowY="auto"
            position="relative"
            bg="white"
          >
            <Box style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>

              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                // @ts-ignore (пока Orval не перегенерировал типы, глушим предупреждение)
                const item = job.urls[virtualRow.index];
                const badge = getUrlBadgeStyles(item.status);

                return (
                  <Flex
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    position="absolute"
                    top={0}
                    left={0}
                    transform={`translateY(${virtualRow.start}px)`}
                    w="100%"
                    h="64px"
                    px={8}
                    align="center"
                    justify="space-between"
                    borderBottom="1px solid"
                    borderColor="gray.100"
                    _hover={{ bg: 'gray.50/40' }}
                    boxSizing="border-box"
                  >
                    {/* Секция URL и ошибок */}
                    <Stack gap={0.5} maxW="45%" overflow="hidden">
                      <Text
                        fontFamily="SFMono-Regular, Consolas, monospace"
                        fontSize="xs"
                        fontWeight="500"
                        color="gray.800"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        {item.url}
                      </Text>
                      {item.error && (
                        <Text fontSize="11px" color="red.500" fontWeight="600" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
                          {item.error}
                        </Text>
                      )}
                    </Stack>

                    {/* Статистика, таймлайны и бейджи ответа */}
                    <Flex align="center" gap={6} whiteSpace="nowrap">

                      {item.startedAt && (
                        <Flex
                          align="center"
                          gap={1.5}
                          fontFamily="SFMono-Regular, Consolas, monospace"
                          fontSize="11px"
                          color="gray.400"
                          fontWeight="500"
                        >
                          <Text>{formatTime(item.startedAt)}</Text>
                          <Text color="gray.300" fontSize="10px">→</Text>
                          <Text color={item.finishedAt ? 'gray.400' : 'blue.500'} fontWeight={item.finishedAt ? '500' : '600'}>
                            {item.finishedAt ? formatTime(item.finishedAt) : '••:••:••'}
                          </Text>
                        </Flex>
                      )}

                      {item.duration !== undefined && item.duration !== null && (
                        <Text fontFamily="SFMono-Regular, Consolas, monospace" fontSize="xs" color="gray.500" fontWeight="600" minW="55px" textAlign="right">
                          {item.duration} мс
                        </Text>
                      )}

                      {item.httpStatus && (
                        <Text
                          fontFamily="SFMono-Regular, Consolas, monospace"
                          fontSize="xs"
                          fontWeight="700"
                          px={1.5}
                          py={0.5}
                          borderRadius="md"
                          bg={item.httpStatus >= 400 ? 'red.500/10' : 'green.50'}
                          color={item.httpStatus >= 400 ? 'red.600' : 'green.700'}
                          minW="30px"
                          textAlign="center"
                        >
                          {item.httpStatus}
                        </Text>
                      )}

                      <Flex
                        px={2.5}
                        py={0.5}
                        bg={badge.bg}
                        color={badge.color}
                        borderRadius="md"
                        fontSize="10px"
                        fontWeight="700"
                        letterSpacing="0.03em"
                        minW="65px"
                        justify="center"
                      >
                        {badge.label.toUpperCase()}
                      </Flex>
                    </Flex>
                  </Flex>
                );
              })}

            </Box>

            {!job?.urls?.length && (
              <Box py={16} textAlign="center" color="gray.400" fontSize="sm" fontWeight="500">
                Данные по адресам отсутствуют.
              </Box>
            )}
          </Box>
        </Box>

      </Stack>
    </Box>
  );
}