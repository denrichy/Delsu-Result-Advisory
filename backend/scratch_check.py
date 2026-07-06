import pandas as pd
df = pd.read_excel(r'C:\Users\HP\Desktop\FYP\just-testing\400_LEVEL_STUDENTS_COPY_1ST_SEMESTER_COMPUTER_SCIE_260701_222840.xlsx')
out_idx = -1
row_idx = 0
found = False
for i in range(15):
    row_vals = df.iloc[i].astype(str).str.strip().tolist()
    for j, v in enumerate(row_vals):
        if 'compulsory courses outstanding' in v.lower():
            out_idx = j
            row_idx = i
            found = True
            break
    if found:
        break
print('Header at row:', row_idx, 'col:', out_idx)
for _, row in df.iterrows():
    if '292155' in str(row.values):
        print('Val at out_idx:', row.values[out_idx])
        print('Next col:', row.values[out_idx+1])
        print('Next:', row.values[out_idx+2])
