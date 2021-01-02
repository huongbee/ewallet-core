const Filehound = require('filehound');
const Path = require('path');
const Fs = require('fs');
const _ = require('lodash');
const Utility = require('./Utility');
const CronJob = require('cron').CronJob;
const AsyncForEach = require('await-async-foreach');

module.exports = {
  async Apply(instanceName, projectDir) {
    try {
      global.core.projects[instanceName].task = {};
      const tasks = global.core.projects[instanceName].task;
      if (!Fs.existsSync(`${projectDir}/tasks`)) {
        Fs.mkdirSync(`${projectDir}/tasks`);
      }
      const pathTaskList = await Filehound.create()
        .path(`${projectDir}/tasks`)
        .ext('.js')
        .glob('*Task.js')
        .find();
      AsyncForEach(pathTaskList, (pathTask) => {
        const taskName = Path.basename(pathTask).replace('Task.js', '');
        const task = Utility.RequireWithCheckExist(pathTask);
        if (_.get(task, 'isActive', false) === false) {
          return false;
        }
        const expression = _.get(task, 'expression', '* * * * * *');
        const options = _.get(task, 'options', {
          timeZone: 'Asia/Ho_Chi_Minh',
          runOnInit: false
        });
        const onTick = _.get(task, 'onTick', () => {
          console.warn(`[${instanceName}] - Not found function onTick at Task ${taskName}`);
        });
        const func = async () => {
          if (options.waitingFinish === true) {
            if (_.isUndefined(tasks[taskName]) === true) tasks[taskName] = { isProcessing: false };
            if (tasks[taskName].isProcessing === false) {
              tasks[taskName].isProcessing = true;
              console.trace(`[${instanceName}] - onTick at ${taskName}`);
              await onTick();
              tasks[taskName].isProcessing = false;
            }
          } else {
            console.log(`[${instanceName}] - onTick at ${taskName}`);
            await onTick();
          }
        };
        if (options.runOnInit === true) {
          func();
        }
        // eslint-disable-next-line no-new
        new CronJob(expression, () => {
          func();
        }, null,
          true,
          options.timeZone
        );
      }, 'parallel', 10);
      return true;
    } catch (error) {
      throw error;
    }
  }
};
