import { EntityRepository, Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status-enum';
import { GetTaskFilterDto } from './dto/get-task-filter.dto';
import { User } from '../auth/user.entity';
import { InternalServerErrorException, Logger } from '@nestjs/common';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  private logger = new Logger('TaskRepository');

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;
    const task = new Task();
    task.title = title;
    task.description = description;
    task.status = TaskStatus.OPEN;
    task.user = user;

    try {
      await task.save();

      delete task.user;
      return task;
    } catch (e) {
      this.logger.error(`User "${user.username}" ailed to create task. CreateTaskDto${JSON.stringify(createTaskDto)}`, e.stack);
      throw new InternalServerErrorException();
    }
  }

  async getTasks(filterDto: GetTaskFilterDto, user: User): Promise<Task[]> {
    const { status, searchTerm } = filterDto;
    const query = this.createQueryBuilder('task');

    query.where('task.usersId = :userId', { userId: user.id });

    if (status) {
      query.andWhere('task.status = :status', {status});
    }

    if (searchTerm) {
      query.andWhere(
        '(task.title LIKE :searchTerm OR task.description LIKE :searchTerm)',
        {searchTerm: `%${searchTerm}%`},
      );
    }

    try {
      const tasks = query.getMany();

      return tasks;
    } catch (e) {
      this.logger.error(`Failed to get tasks for "${user.username}", DTO: ${JSON.stringify(filterDto)}`, e.stack);
      throw new InternalServerErrorException();
    }
  }
}
