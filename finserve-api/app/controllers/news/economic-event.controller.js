const db = require('../../models');
const EconomicEvent = db.economic_events;

// Create and Save a new EconomicEvent
exports.create = (req, res) => {
  // Validate request
  if (!req.body.event_name || !req.body.scheduled_date || !req.body.importance) {
    res.status(400).send({
      message: 'Event name, scheduled date, and importance are required!'
    });
    return;
  }

  // Create an EconomicEvent
  const economicEvent = {
    event_name: req.body.event_name,
    description: req.body.description,
    scheduled_date: req.body.scheduled_date,
    importance: req.body.importance,
    country: req.body.country,
    event_category: req.body.event_category,
    previous_value: req.body.previous_value,
    actual_value: req.body.actual_value,
    forecast_value: req.body.forecast_value
  };

  // Save EconomicEvent in the database
  EconomicEvent.create(economicEvent)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while creating the EconomicEvent.'
      });
    });
};

// Retrieve all EconomicEvents from the database
exports.findAll = (req, res) => {
  const country = req.query.country;
  const importance = req.query.importance;
  var condition = {};

  if (country) condition.country = { [db.Sequelize.Op.iLike]: `%${country}%` };
  if (importance) condition.importance = importance;

  EconomicEvent.findAll({ where: condition })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving economic events.'
      });
    });
};

// Find a single EconomicEvent with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  EconomicEvent.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find EconomicEvent with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error retrieving EconomicEvent with id=' + id
      });
    });
};

// Update an EconomicEvent by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  EconomicEvent.update(req.body, {
    where: { event_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'EconomicEvent was updated successfully.'
        });
      } else {
        res.send({
          message: `Cannot update EconomicEvent with id=${id}. Maybe EconomicEvent was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error updating EconomicEvent with id=' + id
      });
    });
};

// Delete an EconomicEvent with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  EconomicEvent.destroy({
    where: { event_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'EconomicEvent was deleted successfully!'
        });
      } else {
        res.send({
          message: `Cannot delete EconomicEvent with id=${id}. Maybe EconomicEvent was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Could not delete EconomicEvent with id=' + id
      });
    });
};

// Delete all EconomicEvents from the database
exports.deleteAll = (req, res) => {
  EconomicEvent.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} EconomicEvents were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while removing all economic events.'
      });
    });
};

// Find all upcoming EconomicEvents
exports.findUpcoming = (req, res) => {
  const now = new Date();

  EconomicEvent.findAll({
    where: {
      scheduled_date: {
        [db.Sequelize.Op.gte]: now
      }
    },
    order: [['scheduled_date', 'ASC']]
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving upcoming economic events.'
      });
    });
};

// Find EconomicEvents by importance
exports.findByImportance = (req, res) => {
  const importance = req.params.importance;

  EconomicEvent.findAll({
    where: { importance: importance },
    order: [['scheduled_date', 'ASC']]
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving economic events by importance.'
      });
    });
};