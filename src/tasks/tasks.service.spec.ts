import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TaskRepository } from './task.repository';
import { GetTaskFilterDto } from './dto/get-task-filter.dto';
import { TaskStatus } from './task-status-enum';
import { NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';

const mockTaskRepository = () => ({
  getTasks: jest.fn(),
  findOne: jest.fn(),
  createTask: jest.fn(),
  delete: jest.fn(),
});

const mockUser = { id: 1, username: 'Test user' };

describe('TasksService', () => {
  let tasksService;
  let taskRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TaskRepository, useFactory: mockTaskRepository},
      ],
    }).compile();

    tasksService = await module.get<TasksService>(TasksService);
    taskRepository = await module.get<TaskRepository>(TaskRepository);
  });

  describe('getTasks',  () => {
    it('gets all tasks from the repository', async () => {
      // mocks
      taskRepository.getTasks.mockResolvedValue('someValue');

      expect(taskRepository.getTasks).not.toHaveBeenCalled();
      const filters: GetTaskFilterDto = {
        status: TaskStatus.IN_PROGRESS, searchTerm: 'some search',
      };
      const result = await tasksService.getTasks(filters, mockUser);
      expect(taskRepository.getTasks).toHaveBeenCalled();
      expect(result).toEqual('someValue');
    });
  });

  describe('getTasksById', () => {

    it('calls taskRepository.findOne() and successfully retrieve and return task', async () => {
      const mockTask = { title: 'Test task', description: 'Test desc'};

      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await tasksService.getTaskById(1, mockUser);
      expect(result).toEqual(mockTask);

      expect(taskRepository.findOne).toHaveBeenCalledWith({
          where: {
            id: 1,
            userId: mockUser.id,
          },
        });
      });

    it('throws an error as task is not found', () => {
        taskRepository.findOne.mockResolvedValue(null);
        expect(tasksService.getTaskById(1, mockUser)).rejects.toThrow(new NotFoundException());
      });
  });

  describe('createTask', () => {
    it('calls taskRepisotory.create() and returns the result', async () => {
      taskRepository.createTask.mockResolvedValue('someTask');

      expect(taskRepository.createTask).not.toHaveBeenCalled();
      const createTaskDto: CreateTaskDto = { title: 'Test task', description: 'test desc'};
      const result = await tasksService.createTask(createTaskDto, mockUser);
      expect(taskRepository.createTask).toHaveBeenCalledWith(createTaskDto, mockUser);
      expect(result).toEqual('someTask');
    });
  });

  describe('deleteTask', () => {
    it('call taskRepository.deleteTask to delete a task', async () => {
      taskRepository.delete.mockResolvedValue({ affected: 1 });
      expect(taskRepository.delete).not.toHaveBeenCalled();
      await tasksService.deleteTask(1, mockUser);
      expect(taskRepository.delete).toHaveBeenCalledWith({id: 1, userId: mockUser.id });
    });

    it('throws an error as task could not be found', () => {
      taskRepository.delete.mockResolvedValue({ affected: 0 });
      expect(tasksService.deleteTask(1, mockUser)).rejects.toThrow(new NotFoundException(`Task with ID: ${1} not found`));
    });
  });

  describe('updateTaskStatus', () => {
    it('updates a task status', async () => {
      const save = jest.fn();
      tasksService.getTaskById = jest.fn().mockResolvedValue({
        status: TaskStatus.OPEN,
        save: save.mockResolvedValue(true),
      });

      expect(tasksService.getTaskById).not.toHaveBeenCalled();
      const result = await tasksService.updateTaskStatus(1, TaskStatus.DONE, mockUser);
      expect(tasksService.getTaskById).toHaveBeenCalled();
      expect(save).toHaveBeenCalled();
      expect(result.status).toEqual(TaskStatus.DONE);
    });
  });
});
