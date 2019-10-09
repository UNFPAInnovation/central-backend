// Copyright 2017 ODK Central Developers
// See the NOTICE file at the top-level directory of this distribution and at
// https://github.com/opendatakit/central-backend/blob/master/NOTICE.
// This file is part of ODK Central. It is subject to the license terms in
// the LICENSE file found in the top-level directory of this distribution and at
// https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
// including this file, may be copied, modified, propagated, or distributed
// except according to the terms contained in the LICENSE file.
//
// Auths are somewhat abnormal Instances: they are not representations of any
// database tables.
//
// Instead, we use the Auth instance to represent the authentication state of
// any given web request; several cases are possible:
// * A completely unauthenticated request has neither an Actor nor a Session.
//   But it is still possible to call auth.can(), for instance, and the
//   permissions system is capable of granting rights to anonymous users.
// * A request authenticating over Session Bearer Token will have a session
//   associated with it, and if that Session has an Actor, then an Actor as
//   well.
// * A request using HTTPS Basic auth will have an Actor but no Session.
//
// The Auth Instance expects to be instantiated with one or both of the properties
// _actor: Actor? and _session: Session?. Leave them undefined if they do not exist.

const Instance = require('./instance');
const { resolve, reject } = require('../../util/promise');
const Problem = require('../../util/problem');
const Option = require('../../util/option');

module.exports = Instance()(() => class {
  // returns a Promise[Boolean] indicating whether the authenticated Actor may
  // perform the given verb on the given Actee.
  // If no actor is present for this session, will fail.
  can(verb, actee) {
    return this.actor().map((actor) => actor.can(verb, actee)).orElse(resolve(false));
  }

  // See: Actor#canOrReject for behaviour.
  // If no actor is present for this session, will check against anonymous rights.
  // we return the actee so that .then chaining is easily accomplishable
  // without nesting.
  canOrReject(verb, actee) {
    return this.can(verb, actee).then((result) =>
      ((result === true) ? actee : reject(Problem.user.insufficientRights())));
  }

  canAssignRole(role, actee) {
    return this.actor().map((actor) => actor.canAssignRole(role, actee)).orElse(resolve(false));
  }

  // See: Actor#verbsOn.
  verbsOn(actee) { return this.actor().map((actor) => actor.verbsOn(actee)).orElse(resolve([])); }

  // Returns Option[Session] if this Auth has a Session on it.
  session() { return Option.of(this._session); }

  // Returns Option[Actor] if this Auth has an Actor, or a Session containing an Actor,
  // on it.
  actor() {
    const bySession = this.session().map((session) => session.actor);
    return bySession.isDefined() ? bySession : Option.of(this._actor);
  }

  // Returns true only if this Auth is not anonymous.
  isAuthenticated() { return (this._session != null) || (this._actor != null); }
});

