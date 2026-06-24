import { create } from 'zustand';
import { JobsControllerFindOne200, JobResponseDtoStatus } from '../api/generated/model';

interface JobsState {
  jobs: JobsControllerFindOne200[];
  currentJob: JobsControllerFindOne200 | null;

  isLoadingList: boolean;
  isLoadingDetail: boolean;
  isCancelling: boolean;
  error: string | null;

  setJobs: (jobs: JobsControllerFindOne200[]) => void;
  setCurrentJob: (job: JobsControllerFindOne200 | null) => void;
  setError: (error: string | null) => void;

  fetchJobsList: (apiFindAll: () => Promise<JobsControllerFindOne200[]>) => Promise<void>;
  fetchJobDetail: (id: string, apiFindOne: (id: string) => Promise<JobsControllerFindOne200>) => Promise<void>;
  cancelJobExecution: (id: string, apiRemove: (params: { id: string }) => Promise<void>) => Promise<void>;
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  currentJob: null,
  isLoadingList: false,
  isLoadingDetail: false,
  isCancelling: false,
  error: null,

  setJobs: (jobs) => set({ jobs }),
  setCurrentJob: (currentJob) => set({ currentJob }),
  setError: (error) => set({ error }),

  fetchJobsList: async (apiFindAll) => {
    set({ isLoadingList: true, error: null });
    try {
      const data = await apiFindAll();
      set({ jobs: data, isLoadingList: false });
    } catch (err: any) {
      set({ error: err.message || 'Ошибка при загрузке списка задач', isLoadingList: false });
    }
  },

  fetchJobDetail: async (id, apiFindOne) => {
    if (!get().currentJob || get().currentJob?.id !== id) {
      set({ isLoadingDetail: true });
    }
    set({ error: null });

    try {
      const data = await apiFindOne(id);
      set({ currentJob: data, isLoadingDetail: false });
    } catch (err: any) {
      set({ error: err.message || 'Ошибка при загрузке деталей задачи', isLoadingDetail: false });
    }
  },

  cancelJobExecution: async (id, apiRemove) => {
    set({ isCancelling: true, error: null });
    try {
      await apiRemove({ id });

      const current = get().currentJob;
      if (current && current.id === id) {
        set({ currentJob: { ...current, status: JobResponseDtoStatus['cancelled'] } });
      }

      const updatedJobs = get().jobs.map(j => j.id === id ? { ...j, status: JobResponseDtoStatus['cancelled'] } : j);
      set({ jobs: updatedJobs, isCancelling: false });
    } catch (err: any) {
      set({ error: err.message || 'Не удалось прервать обработку', isCancelling: false });
    }
  },
}));