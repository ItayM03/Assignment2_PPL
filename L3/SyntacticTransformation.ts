import {
    ClassExp, ProcExp, Exp, Program, Binding, CExp,
    isProgram, isDefineExp, isAtomicExp, isLitExp, isIfExp, isAppExp, isProcExp, isLetExp, isClassExp,
    makeProgram, makeDefineExp, makeIfExp, makeAppExp, makeProcExp, makeLetExp, makeBinding, makeClassExp,
    makeVarDecl, makeVarRef, makePrimOp, makeLitExp, makeBoolExp
} from "./L3-ast";
import { makeSymbolSExp } from "./L3-value";
import { Result, makeFailure, makeOk } from "../shared/result";
import { map, reduceRight } from "ramda";

/*
Purpose: Transform ClassExp to ProcExp
Signature: class2proc(classExp)
Type: ClassExp => ProcExp
*/
export const class2proc = (exp: ClassExp): ProcExp => {
    const body: ProcExp = makeProcExp(
        [makeVarDecl("msg")],
        [
            reduceRight((method: Binding, acc: CExp) => 
                makeIfExp(
                    makeAppExp(makePrimOp("eq?"), [
                        makeVarRef("msg"),
                        makeLitExp(makeSymbolSExp(method.var.var))
                    ]),
                    isProcExp(method.val) ? method.val.body[0] : method.val,
                    acc
                ),
                makeLitExp(makeSymbolSExp("error")),
                exp.methods
            )
        ]
    );
    return makeProcExp(exp.fields, [body]);
}


/*
Purpose: Transform all class forms in the given AST to procs
Signature: transform(AST)
Type: [Exp | Program] => Result<Exp | Program>
*/

export const transform = (exp: Exp | Program): Result<Exp | Program> =>
    isProgram(exp) ? makeOk(makeProgram(map(transformExp, exp.exps))) :
    makeOk(transformExp(exp));

const transformExp = (exp: Exp): Exp =>
    isDefineExp(exp) ? makeDefineExp(exp.var, transformCExp(exp.val)) :
    transformCExp(exp);

const transformCExp = (exp: CExp): CExp =>
    isAtomicExp(exp) ? exp :
    isLitExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(transformCExp(exp.test), transformCExp(exp.then), transformCExp(exp.alt)) :
    isAppExp(exp) ? makeAppExp(transformCExp(exp.rator), map(transformCExp, exp.rands)) :
    isProcExp(exp) ? makeProcExp(exp.args, map(transformCExp, exp.body)) :
    isLetExp(exp) ? makeLetExp(
        map((b: Binding) => makeBinding(b.var.var, transformCExp(b.val)), exp.bindings),
        map(transformCExp, exp.body)
    ) :
    isClassExp(exp) ? class2proc(makeClassExp(
        exp.fields,
        map((b: Binding) => makeBinding(b.var.var, transformCExp(b.val)), exp.methods)
    )) :
    exp;