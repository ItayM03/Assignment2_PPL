import {
    Exp, Program, CExp,
    isProgram, isDefineExp, isNumExp, isBoolExp, isPrimOp,
    isVarRef, isIfExp, isProcExp, isAppExp
} from './L3/L3-ast';
import { Result, makeOk } from './shared/result';


/*
Purpose: Transform L2 AST to Python program string
Signature: l2ToPython(l2AST)
Type: [Parsed | Error] => Result<string>
*/

const isInfixOp = (op: string): boolean =>
    ["+", "-", "*", "/", "<", ">", "=", "and", "or", "eq?"].includes(op);

const pythonPrimOp = (op: string): string =>
    (op === "=" || op === "eq?") ? "==" : op;

const unaryPrimOpToPython = (op: string): string =>
    op === "not" ? "not" :
    op === "number?" ? "(lambda x : (type(x) == int or type(x) == float))" :
    op === "boolean?" ? "(lambda x : (type(x) == bool))" :
    op;

const l2ExpToPython = (exp: Exp | Program): string =>
    isProgram(exp) ? exp.exps.map(l2ExpToPython).join("\n") :
    isDefineExp(exp) ? `${exp.var.var} = ${l2ExpToPython(exp.val)}` :
    isNumExp(exp) ? exp.val.toString() :
    isBoolExp(exp) ? (exp.val ? "True" : "False") :
    isVarRef(exp) ? exp.var :
    isPrimOp(exp) ? unaryPrimOpToPython(exp.op) :
    isIfExp(exp) ? `(${l2ExpToPython(exp.then)} if ${l2ExpToPython(exp.test)} else ${l2ExpToPython(exp.alt)})` :
    isProcExp(exp) ? `(lambda ${exp.args.map((arg) => arg.var).join(",")} : ${l2ExpToPython(exp.body[0])})` :
    isAppExp(exp) ? appExpToPython(exp.rator, exp.rands) :
    "Error";

const appExpToPython = (rator: CExp, rands: CExp[]): string =>
    isPrimOp(rator) && isInfixOp(rator.op) ?
        `(${rands.map(l2ExpToPython).join(` ${pythonPrimOp(rator.op)} `)})` :
    isPrimOp(rator) && rator.op === "not" ?
        `(not ${l2ExpToPython(rands[0])})` :
    `${l2ExpToPython(rator)}(${rands.map(l2ExpToPython).join(",")})`;

export const l2ToPython = (exp: Exp | Program): Result<string> =>
    makeOk(l2ExpToPython(exp));